export async function downloadSignedApk(
  onProgress?: (state: 'downloading' | 'done' | 'error') => void
): Promise<void> {
  try {
    onProgress?.('downloading');
    const response = await fetch(`/Starward-Mobile.apk?t=${Date.now()}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify valid ZIP/APK magic header (PK\x03\x04)
    if (
      bytes.length < 50000 ||
      bytes[0] !== 0x50 ||
      bytes[1] !== 0x4b ||
      bytes[2] !== 0x03 ||
      bytes[3] !== 0x04
    ) {
      throw new Error('Invalid APK binary header');
    }

    const blob = new Blob([buffer], {
      type: 'application/vnd.android.package-archive',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Starward-Mobile-v2.1.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
    onProgress?.('done');
  } catch {
    onProgress?.('error');
    // Fallback to direct anchor download
    const link = document.createElement('a');
    link.href = `/Starward-Mobile.apk?t=${Date.now()}`;
    link.download = 'Starward-Mobile-v2.1.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
