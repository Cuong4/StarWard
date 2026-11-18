import React, { useState } from 'react';

interface PcDownloadModalProps {
  onClose: () => void;
}

export const PcDownloadModal: React.FC<PcDownloadModalProps> = ({ onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadExe = () => {
    setDownloading(true);
    const isRawGitHubRoot =
      typeof window !== 'undefined' &&
      Boolean((window as unknown as { __ghFallbackLoaded?: boolean }).__ghFallbackLoaded);
    const exeUrl = isRawGitHubRoot ? './public/Starward-PC.exe' : './Starward-PC.exe';

    const link = document.createElement('a');
    link.href = exeUrl;
    link.download = 'Starward-Chien-Truong-Tinh-Ha-PC.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#07090E]/90 p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#0D111A] border border-amber-500/60 p-6 md:p-8 shadow-2xl my-auto"
        style={{ clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px))' }}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400">
              BẢN PHÁT HÀNH WINDOWS PC ĐỘC LẬP • 60FPS NATIVE
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-slate-100 mt-1">
              TẢI GAME PC (.EXE) — STARWARD
            </h2>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs uppercase tracking-widest border border-slate-600/50 transition-colors cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>

        {/* Main Download Card */}
        <div className="mt-5 p-5 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-cyan-500/15 border border-amber-400/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-300">
                GÓI CÀI ĐẶT / CHẠY NGAY TRÊN WINDOWS 10 &amp; 11 (64-BIT)
              </div>
              <div className="font-display text-lg font-bold text-slate-100 mt-1">
                Starward-Chien-Truong-Tinh-Ha-PC.exe
              </div>
              <div className="font-mono text-xs text-slate-400 mt-1">
                Tích hợp đầy đủ 10 Chiến Cơ • 8 Chiến Khu Đổi Màu • Vật Phẩm Boost • Tùy Chỉnh Phím Q/E
              </div>
            </div>

            <button
              onClick={handleDownloadExe}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer shrink-0"
              style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))' }}
            >
              {downloading ? 'ĐANG TẢI .EXE...' : '⬇ TẢI FILE .EXE NGAY'}
            </button>
          </div>

          {downloaded && (
            <div className="mt-4 p-3 bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 font-mono text-xs">
              ✓ Đã bắt đầu tải xuống <strong>Starward-Chien-Truong-Tinh-Ha-PC.exe</strong>! Mở file vừa tải trên máy tính Windows của bạn để chiến ngay trong cửa sổ Desktop riêng biệt.
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#121826] border border-slate-800">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">BƯỚC 1</div>
            <div className="font-display text-sm font-bold text-slate-100 mt-1 uppercase">TẢI FILE .EXE</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Nhấn nút <strong>Tải File .EXE Ngay</strong> phía trên để lưu bộ chạy độc lập về máy tính Windows.
            </p>
          </div>

          <div className="p-3.5 bg-[#121826] border border-slate-800">
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-400">BƯỚC 2</div>
            <div className="font-display text-sm font-bold text-slate-100 mt-1 uppercase">KHỞI CHẠY TRỰC TIẾP</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Nhấp đúp vào <strong>Starward-Chien-Truong-Tinh-Ha-PC.exe</strong>. Nếu Windows SmartScreen hỏi, chọn <em>More info &rarr; Run anyway</em>.
            </p>
          </div>

          <div className="p-3.5 bg-[#121826] border border-slate-800">
            <div className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">BƯỚC 3</div>
            <div className="font-display text-sm font-bold text-slate-100 mt-1 uppercase">CHIẾN OFFLINE 100%</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Toàn bộ dữ liệu đồ họa và âm thanh WebAudio được đóng gói bên trong file <code>.exe</code>, chơi mượt không cần mạng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
