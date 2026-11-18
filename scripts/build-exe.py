#!/usr/bin/env python3
"""
Builds a standalone Windows x64 Portable Executable (Starward-PC.exe)
containing the entire compiled Starward PC game bundle (HTML + CSS + JS)
and launching it in a dedicated Windows Desktop application window.
"""
import base64
import glob
import os
import struct
import zlib

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")


def build_self_contained_html() -> bytes:
    """Inlines the compiled CSS and JS from dist/ into a single self-contained HTML file."""
    index_path = os.path.join(DIST_DIR, "index.html")
    if not os.path.exists(index_path):
        return b"<html><body><h1>Starward PC</h1></body></html>"

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Inline CSS assets
    css_files = glob.glob(os.path.join(DIST_DIR, "assets", "*.css"))
    css_content = ""
    for css_file in css_files:
        with open(css_file, "r", encoding="utf-8") as f:
            css_content += f.read() + "\n"

    # Inline JS assets
    js_files = glob.glob(os.path.join(DIST_DIR, "assets", "*.js"))
    js_content = ""
    for js_file in js_files:
        with open(js_file, "r", encoding="utf-8") as f:
            js_content += f.read() + "\n"

    standalone_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Starward — Chiến Trường Tinh Hà (PC Edition)</title>
  <style>{css_content}</style>
</head>
<body style="margin:0;padding:0;background:#07090E;overflow:hidden;user-select:none;">
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

    # IMAGE_FILE_HEADER (20 bytes): Machine=AMD64 (0x8664), NumberOfSections=2
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

    # Build .text section at RVA 0x1000
    # Imports located in .rdata at RVA 0x2000:
    # IAT[0] at RVA 0x2058 = WinExec
    # IAT[1] at RVA 0x2060 = ExitProcess
    # Command string at RVA 0x20A0
    # x64 assembly:
    #   sub rsp, 0x28
    #   lea rcx, [rip + offset_to_cmd]
    #   mov edx, 0 (SW_HIDE)
    #   call qword ptr [rip + offset_to_WinExec]
    #   xor ecx, ecx
    #   call qword ptr [rip + offset_to_ExitProcess]
    code = bytearray()
    code += b"\x48\x83\xEC\x28"                  # sub rsp, 0x28 (4 bytes, end RIP=0x1004)
    # lea rcx, [rip + disp32] -> target RVA 0x20A0, next RIP = 0x100B => disp32 = 0x20A0 - 0x100B = 0x1095
    code += b"\x48\x8D\x0D" + struct.pack("<i", 0x20A0 - 0x100B)
    code += b"\xBA\x00\x00\x00\x00"              # mov edx, 0 (5 bytes, end RIP=0x1010)
    # call [rip + disp32] -> target IAT[0] RVA 0x2058, next RIP = 0x1016 => disp32 = 0x2058 - 0x1016 = 0x1042
    code += b"\xFF\x15" + struct.pack("<i", 0x2058 - 0x1016)
    code += b"\x31\xC9"                          # xor ecx, ecx (2 bytes, end RIP=0x1018)
    # call [rip + disp32] -> target IAT[1] RVA 0x2060, next RIP = 0x101E => disp32 = 0x2060 - 0x101E = 0x1042
    code += b"\xFF\x15" + struct.pack("<i", 0x2060 - 0x101E)
    code += b"\xCC"

    text_raw_size = align(len(code), file_align)
    text_section_data = code.ljust(text_raw_size, b"\x00")

    # Build .rdata section at RVA 0x2000
    # Layout inside .rdata (base RVA = 0x2000):
    # 0x0000 (RVA 0x2000): IMAGE_IMPORT_DESCRIPTOR for KERNEL32.dll (20 bytes) + Null descriptor (20 bytes) = 40 bytes
    # 0x0038 (RVA 0x2038): ILT (Import Lookup Table): 3 x uint64 (24 bytes)
    # 0x0058 (RVA 0x2058): IAT (Import Address Table): 3 x uint64 (24 bytes)
    # 0x0070 (RVA 0x2070): "KERNEL32.dll\0" (13 bytes)
    # 0x0080 (RVA 0x2080): Hint/Name 0: uint16(0) + "WinExec\0" (10 bytes)
    # 0x0090 (RVA 0x2090): Hint/Name 1: uint16(0) + "ExitProcess\0" (14 bytes)
    # 0x00A0 (RVA 0x20A0): Command line string + null terminator + embedded payload
    rdata = bytearray(0xA0)

    # Import Descriptor 0 (KERNEL32.dll)
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
    # ILT entries
    struct.pack_into("<QQQ", rdata, 0x38, 0x2080, 0x2090, 0)
    # IAT entries
    struct.pack_into("<QQQ", rdata, 0x58, 0x2080, 0x2090, 0)
    # DLL Name
    rdata[0x70:0x70 + 13] = b"KERNEL32.dll\x00"
    # Hint/Name 0: WinExec
    rdata[0x80:0x80 + 10] = b"\x00\x00WinExec\x00"
    # Hint/Name 1: ExitProcess
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

    # Optional Header PE32+ (240 bytes)
    opt_header = bytearray(240)
    struct.pack_into(
        "<HBBIIIIIQIIHHHHHHIIIIHHQQQQII",
        opt_header,
        0,
        0x020B,             # Magic: PE32+
        14,                 # MajorLinkerVersion
        0,                  # MinorLinkerVersion
        text_raw_size,      # SizeOfCode
        rdata_raw_size,     # SizeOfInitializedData
        0,                  # SizeOfUninitializedData
        0x1000,             # AddressOfEntryPoint
        0x1000,             # BaseOfCode
        image_base,         # ImageBase
        section_align,      # SectionAlignment
        file_align,         # FileAlignment
        6,                  # MajorOperatingSystemVersion
        0,                  # MinorOperatingSystemVersion
        0,                  # MajorImageVersion
        0,                  # MinorImageVersion
        6,                  # MajorSubsystemVersion
        0,                  # MinorSubsystemVersion
        0,                  # Win32VersionValue
        size_of_image,      # SizeOfImage
        size_of_headers,    # SizeOfHeaders
        0,                  # CheckSum
        2,                  # Subsystem: IMAGE_SUBSYSTEM_WINDOWS_GUI (2)
        0x8140,             # DllCharacteristics: DYNAMIC_BASE | NX_COMPAT | TERMINAL_SERVER_AWARE
        0x100000,           # SizeOfStackReserve
        0x1000,             # SizeOfStackCommit
        0x100000,           # SizeOfHeapReserve
        0x1000,             # SizeOfHeapCommit
        0,                  # LoaderFlags
        16,                 # NumberOfRvaAndSizes
    )

    # Data Directory[1]: Import Table (RVA 0x2000, Size 40)
    struct.pack_into("<II", opt_header, 112 + 8, 0x2000, 40)
    # Data Directory[12]: IAT (RVA 0x2058, Size 24)
    struct.pack_into("<II", opt_header, 112 + 12 * 8, 0x2058, 24)

    # Section Headers (40 bytes each)
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
        0x60000020,  # CNT_CODE | MEM_EXECUTE | MEM_READ
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
        0x40000040,  # CNT_INITIALIZED_DATA | MEM_READ
    )

    headers = (dos_header + pe_sig + coff_header + opt_header + text_hdr + rdata_hdr).ljust(
        size_of_headers, b"\x00"
    )
    return bytes(headers + text_section_data + rdata_section_data)


def main() -> None:
    # Remove old mobile APK if present
    for old_apk in [
        os.path.join(PUBLIC_DIR, "Starward-Mobile.apk"),
        os.path.join(DIST_DIR, "Starward-Mobile.apk"),
    ]:
        if os.path.exists(old_apk):
            try:
                os.remove(old_apk)
            except OSError:
                pass

    standalone_html = build_self_contained_html()
    compressed_html = zlib.compress(standalone_html, level=9)
    b64_payload = base64.b64encode(compressed_html)

    # PowerShell command that extracts the embedded HTML bundle from the running .exe
    # into %TEMP%\Starward-PC.html and opens it in a borderless desktop app window (Edge/Chrome/Default)
    ps_script = (
        "$exe = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName; "
        "$raw = [System.IO.File]::ReadAllText($exe); "
        "$marker = '<!-- STARWARD_EMBEDDED_ARCHIVE_START -->'; "
        "$idx = $raw.IndexOf($marker); "
        "if ($idx -ge 0) { "
        "  $b64 = $raw.Substring($idx + $marker.Length).Trim().Trim([char]0); "
        "  $bytes = [System.Convert]::FromBase64String($b64); "
        "  $ms = New-Object System.IO.MemoryStream(,$bytes); "
        "  $ null = $ms.ReadByte(); $null = $ms.ReadByte(); "
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

    if os.path.exists(DIST_DIR):
        dist_exe = os.path.join(DIST_DIR, "Starward-PC.exe")
        with open(dist_exe, "wb") as f:
            f.write(exe_bytes)

    print(f"[Starward PC Builder] Generated Windows x64 executable: {pub_exe} ({len(exe_bytes):,} bytes)")


if __name__ == "__main__":
    main()
