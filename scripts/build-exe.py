#!/usr/bin/env python3
"""
1. Builds a standalone Windows x64 Portable Executable (Starward-PC.exe)
   containing the entire compiled Starward PC game bundle (HTML + CSS + JS).
2. Copies the compiled JS/CSS bundle into public/github-pages-bundle.{js,css}
   and docs/index.html so GitHub Pages works immediately whether configured
   via GitHub Actions, /docs folder, or directly from the root branch.
"""
import base64
import glob
import os
import shutil
import struct
import zlib

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")
DOCS_DIR = os.path.join(ROOT_DIR, "docs")


def get_compiled_css_and_js() -> tuple[str, str]:
    css_files = sorted(glob.glob(os.path.join(DIST_DIR, "assets", "*.css")))
    css_content = ""
    for css_file in css_files:
        with open(css_file, "r", encoding="utf-8") as f:
            css_content += f.read() + "\n"

    js_files = sorted(glob.glob(os.path.join(DIST_DIR, "assets", "*.js")))
    js_content = ""
    for js_file in js_files:
        with open(js_file, "r", encoding="utf-8") as f:
            js_content += f.read() + "\n"

    return css_content, js_content


def build_self_contained_html(css_content: str, js_content: str) -> bytes:
    """Inlines the compiled CSS and JS from dist/ into a single self-contained HTML file."""
    standalone_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Starward — Chiến Trường Tinh Hà (PC Edition)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>{css_content}</style>
</head>
<body style="margin:0;padding:0;background:#07090E;color:#F8FAFC;overflow:hidden;user-select:none;">
  <div id="root"></div>
  <script type="module">
{js_content}
  </script>
</body>
</html>"""
    return standalone_html.encode("utf-8")


def align(val: int, alignment: int) -> int:
    return (val + alignment - 1) & ~(alignment - 1)


def create_windows_pe64_exe(cmd_line_bytes: bytes, embedded_payload: bytes) -> bytes:
    """
    Constructs a valid 64-bit Windows Portable Executable (PE32+) GUI application
    that invokes WinExec(cmd_line) and ExitProcess(0) via KERNEL32.dll,
    with the compressed HTML game bundle embedded in the .rdata section.
    """
    dos_header = bytearray(64)
    dos_header[0:2] = b"MZ"
    struct.pack_into("<I", dos_header, 60, 64)

    pe_sig = b"PE\x00\x00"

    coff_header = struct.pack(
        "<HHIIIHH",
        0x8664,  # Machine: AMD64
        2,       # NumberOfSections: .text, .rdata
        0x673B0000,
        0,
        0,
        240,     # SizeOfOptionalHeader (PE32+)
        0x0022,  # Characteristics: EXECUTABLE_IMAGE | LARGE_ADDRESS_AWARE
    )

    image_base = 0x140000000
    section_align = 0x1000
    file_align = 0x200

    code = bytearray()
    code += b"\x48\x83\xEC\x28"                  # sub rsp, 0x28
    code += b"\x48\x8D\x0D" + struct.pack("<i", 0x20A0 - 0x100B)
    code += b"\xBA\x00\x00\x00\x00"              # mov edx, 0 (SW_HIDE)
    code += b"\xFF\x15" + struct.pack("<i", 0x2058 - 0x1016)
    code += b"\x31\xC9"                          # xor ecx, ecx
    code += b"\xFF\x15" + struct.pack("<i", 0x2060 - 0x101E)
    code += b"\xCC"

    text_raw_size = align(len(code), file_align)
    text_section_data = code.ljust(text_raw_size, b"\x00")

    rdata = bytearray(0xA0)
    struct.pack_into(
        "<IIIII",
        rdata,
        0x00,
        0x2038,  # OriginalFirstThunk (ILT RVA)
        0,
        0,
        0x2070,  # Name RVA ("KERNEL32.dll")
        0x2058,  # FirstThunk (IAT RVA)
    )
    struct.pack_into("<QQQ", rdata, 0x38, 0x2080, 0x2090, 0)
    struct.pack_into("<QQQ", rdata, 0x58, 0x2080, 0x2090, 0)
    rdata[0x70:0x70 + 13] = b"KERNEL32.dll\x00"
    rdata[0x80:0x80 + 10] = b"\x00\x00WinExec\x00"
    rdata[0x90:0x90 + 14] = b"\x00\x00ExitProcess\x00"

    rdata += cmd_line_bytes + b"\x00"
    rdata += b"\n<!-- STARWARD_EMBEDDED_ARCHIVE_START -->\n"
    rdata += embedded_payload

    rdata_virt_size = len(rdata)
    rdata_raw_size = align(rdata_virt_size, file_align)
    rdata_section_data = rdata.ljust(rdata_raw_size, b"\x00")

    rdata_num_pages = align(rdata_virt_size, section_align)
    size_of_image = 0x2000 + rdata_num_pages
    size_of_headers = align(64 + 4 + 20 + 240 + 40 * 2, file_align)

    opt_header = bytearray(240)
    struct.pack_into(
        "<HBBIIIIIQIIHHHHHHIIIIHHQQQQII",
        opt_header,
        0,
        0x020B,             # Magic: PE32+
        14,
        0,
        text_raw_size,
        rdata_raw_size,
        0,
        0x1000,
        0x1000,
        image_base,
        section_align,
        file_align,
        6,
        0,
        0,
        0,
        6,
        0,
        0,
        size_of_image,
        size_of_headers,
        0,
        2,                  # Subsystem: IMAGE_SUBSYSTEM_WINDOWS_GUI (2)
        0x8140,
        0x100000,
        0x1000,
        0x100000,
        0x1000,
        0,
        16,
    )

    struct.pack_into("<II", opt_header, 112 + 8, 0x2000, 40)
    struct.pack_into("<II", opt_header, 112 + 12 * 8, 0x2058, 24)

    text_hdr = struct.pack(
        "<8sIIIIIIHHI",
        b".text\x00\x00\x00",
        len(code),
        0x1000,
        text_raw_size,
        size_of_headers,
        0,
        0,
        0,
        0,
        0x60000020,
    )

    rdata_hdr = struct.pack(
        "<8sIIIIIIHHI",
        b".rdata\x00\x00",
        rdata_virt_size,
        0x2000,
        rdata_raw_size,
        size_of_headers + text_raw_size,
        0,
        0,
        0,
        0,
        0x40000040,
    )

    headers = (dos_header + pe_sig + coff_header + opt_header + text_hdr + rdata_hdr).ljust(
        size_of_headers, b"\x00"
    )
    return bytes(headers + text_section_data + rdata_section_data)


def main() -> None:
    # Remove any old mobile artifacts
    old_files = [
        os.path.join(PUBLIC_DIR, "Starward-Mobile.apk"),
        os.path.join(PUBLIC_DIR, "Starward-Mobile.apk.idsig"),
        os.path.join(PUBLIC_DIR, "Starward-Mobile-Offline.html"),
        os.path.join(DIST_DIR, "Starward-Mobile.apk"),
        os.path.join(DIST_DIR, "Starward-Mobile.apk.idsig"),
        os.path.join(DIST_DIR, "Starward-Mobile-Offline.html"),
    ]
    for old_f in old_files:
        if os.path.exists(old_f):
            try:
                os.remove(old_f)
            except OSError:
                pass

    css_content, js_content = get_compiled_css_and_js()
    standalone_html = build_self_contained_html(css_content, js_content)
    compressed_html = zlib.compress(standalone_html, level=9)
    b64_payload = base64.b64encode(compressed_html)

    ps_script = (
        "$exe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName; "
        "$raw = [System.IO.File]::ReadAllText($exe); "
        "$marker = '<!-- STARWARD_EMBEDDED_ARCHIVE_START -->'; "
        "$idx = $raw.IndexOf($marker); "
        "if ($idx -ge 0) { "
        "  $b64 = $raw.Substring($idx + $marker.Length).Trim().Trim([char]0); "
        "  $bytes = [System.Convert]::FromBase64String($b64); "
        "  $ms = New-Object System.IO.MemoryStream(,$bytes); "
        "  $null = $ms.ReadByte(); $null = $ms.ReadByte(); "
        "  $ds = New-Object System.IO.Compression.DeflateStream($ms, [System.IO.Compression.CompressionMode]::Decompress); "
        "  $sr = New-Object System.IO.StreamReader($ds, [System.Text.Encoding]::UTF8); "
        "  $html = $sr.ReadToEnd(); "
        "  $out = Join-Path $env:TEMP 'Starward-Chien-Truong-Tinh-Ha-PC.html'; "
        "  [System.IO.File]::WriteAllText($out, $html, [System.Text.Encoding]::UTF8); "
        "  if (Get-Command msedge -ErrorAction SilentlyContinue) { Start-Process msedge \"--app=file:///$($out -replace '\\\\','/') --window-size=1440,900\" } "
        "  elseif (Get-Command chrome -ErrorAction SilentlyContinue) { Start-Process chrome \"--app=file:///$($out -replace '\\\\','/') --window-size=1440,900\" } "
        "  else { Start-Process $out } "
        "}"
    )

    cmd_line = f'powershell.exe -NoProfile -WindowStyle Hidden -Command "{ps_script}"'
    exe_bytes = create_windows_pe64_exe(cmd_line.encode("utf-8"), b64_payload)

    os.makedirs(PUBLIC_DIR, exist_ok=True)
    pub_exe = os.path.join(PUBLIC_DIR, "Starward-PC.exe")
    with open(pub_exe, "wb") as f:
        f.write(exe_bytes)

    # Save pre-compiled bundle in public/ so raw GitHub Pages root branch hosting works too
    if css_content:
        with open(os.path.join(PUBLIC_DIR, "github-pages-bundle.css"), "w", encoding="utf-8") as f:
            f.write(css_content)
    if js_content:
        with open(os.path.join(PUBLIC_DIR, "github-pages-bundle.js"), "w", encoding="utf-8") as f:
            f.write(js_content)

    with open(os.path.join(PUBLIC_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
        f.write("")
    with open(os.path.join(ROOT_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
        f.write("")

    if os.path.exists(DIST_DIR):
        dist_exe = os.path.join(DIST_DIR, "Starward-PC.exe")
        with open(dist_exe, "wb") as f:
            f.write(exe_bytes)
        with open(os.path.join(DIST_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
            f.write("")

        # Also sync docs/ folder for GitHub Pages "/docs" branch deployment option
        os.makedirs(DOCS_DIR, exist_ok=True)
        with open(os.path.join(DOCS_DIR, "index.html"), "wb") as f:
            f.write(standalone_html)
        with open(os.path.join(DOCS_DIR, "Starward-PC.exe"), "wb") as f:
            f.write(exe_bytes)
        with open(os.path.join(DOCS_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
            f.write("")
        icon_src = os.path.join(PUBLIC_DIR, "icon.svg")
        if os.path.exists(icon_src):
            shutil.copyfile(icon_src, os.path.join(DOCS_DIR, "icon.svg"))

    print(f"[Starward PC Builder] Generated Windows x64 executable: {pub_exe} ({len(exe_bytes):,} bytes)")
    print("[Starward PC Builder] Updated GitHub Pages bundles in public/ and docs/")


if __name__ == "__main__":
    main()
