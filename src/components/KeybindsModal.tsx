import React, { useEffect, useState } from 'react';
import { DashDirectionMode, KeybindConfig } from '../game/types';
import { DEFAULT_KEYBINDS, formatKeyLabel } from '../game/catalog';

type KeybindAction = keyof KeybindConfig;

interface KeybindsModalProps {
  keybinds: KeybindConfig;
  dashDirectionMode: DashDirectionMode;
  onUpdateKeybinds: (next: KeybindConfig) => void;
  onUpdateDashDirection: (mode: DashDirectionMode) => void;
  onClose: () => void;
}

const KEYBIND_ROWS: { action: KeybindAction; label: string; desc: string; highlight?: boolean }[] = [
  {
    action: 'dash',
    label: 'KỸ NĂNG LƯỚT & ĐÈ GIỮ TỤ LỰC (DASH / CHARGE)',
    desc: 'Nhấn nhanh để lướt xuyên đạn; hoặc ĐÈ GIỮ 1 giây rồi thả để bùng nổ Siêu Kỹ Năng Tụ Lực riêng của tàu',
    highlight: true,
  },
  {
    action: 'overdrive',
    label: 'CHIÊU CUỐI NỘ OVERDRIVE (10 GIÂY)',
    desc: 'Gây sát thương lên địch để tích đủ 100% Nộ, kích hoạt 10 giây siêu sức mạnh 3D riêng biệt của từng tàu',
    highlight: true,
  },
  { action: 'up', label: 'BAY LÊN TRÊN', desc: 'Điều khiển chiến cơ tiến lên phía bắc bản đồ' },
  { action: 'down', label: 'BAY XUỐNG DƯỚI', desc: 'Điều khiển chiến cơ lùi xuống phía nam bản đồ' },
  { action: 'left', label: 'BAY SANG TRÁI', desc: 'Điều khiển chiến cơ dịch chuyển sang trái' },
  { action: 'right', label: 'BAY SANG PHẢI', desc: 'Điều khiển chiến cơ dịch chuyển sang phải' },
  { action: 'fire', label: 'KHAI HỎA BẰNG PHÍM', desc: 'Giữ phím này (hoặc Chuột Trái) để khai hỏa vũ khí chính' },
  { action: 'pause', label: 'TẠM DỪNG TRẬN ĐẤU', desc: 'Mở bảng tạm dừng chiến thuật giữa trận' },
];

export const KeybindsModal: React.FC<KeybindsModalProps> = ({
  keybinds,
  dashDirectionMode,
  onUpdateKeybinds,
  onUpdateDashDirection,
  onClose,
}) => {
  const [listeningAction, setListeningAction] = useState<KeybindAction | null>(null);

  useEffect(() => {
    if (!listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const code = e.code;
      if (!code) return;

      const updated: KeybindConfig = {
        ...keybinds,
        [listeningAction]: code,
      };
      onUpdateKeybinds(updated);
      setListeningAction(null);
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [listeningAction, keybinds, onUpdateKeybinds]);

  const handleResetDefaults = () => {
    onUpdateKeybinds({ ...DEFAULT_KEYBINDS });
    onUpdateDashDirection('mouse');
    setListeningAction(null);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#07090E]/88 p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-[#0D111A] border border-cyan-500/50 p-6 md:p-7 shadow-2xl my-auto"
        style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400">
              CẤU HÌNH ĐIỀU KHIỂN PC &amp; CƠ CHẾ LƯỚT
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-slate-100 mt-0.5">
              TÙY CHỈNH PHÍM TẮT &amp; HƯỚNG LƯỚT
            </h2>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs uppercase tracking-widest border border-slate-600/50 transition-colors cursor-pointer"
          >
            ĐÓNG
          </button>
        </div>

        {/* Dash Direction Mode Selector */}
        <div className="mt-4 p-4 bg-[#12192B] border border-amber-500/40">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold mb-2">
            CHẾ ĐỘ HƯỚNG KỸ NĂNG LƯỚT [Q / CHUỘT PHẢI]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onUpdateDashDirection('mouse')}
              className={`p-3 text-left border transition-all cursor-pointer ${
                dashDirectionMode === 'mouse'
                  ? 'bg-amber-500/20 border-amber-400 text-slate-100'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-display text-xs font-bold uppercase tracking-wider text-amber-300">
                🎯 LƯỚT THEO HƯỚNG CON CHUỘT
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Chiến cơ sẽ lao thẳng về vị trí tâm ngắm con trỏ chuột hiện tại trên màn hình.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onUpdateDashDirection('movement')}
              className={`p-3 text-left border transition-all cursor-pointer ${
                dashDirectionMode === 'movement'
                  ? 'bg-cyan-500/20 border-cyan-400 text-slate-100'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300">
                ⌨ LƯỚT THEO HƯỚNG DI CHUYỂN (WASD)
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Chiến cơ lướt theo hướng phím di chuyển bạn đang bấm (nếu đứng yên sẽ lướt theo chuột).
              </p>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          Nhấn vào nút phím ở bất kỳ dòng nào rồi bấm phím mới trên bàn phím để gán lại. Bạn có thể <span className="text-amber-300 font-semibold">Đè giữ phím Lướt (hoặc Chuột Phải) 1 giây</span> để tụ năng lượng và tung Siêu Tuyệt Kỹ Bùng Phá!
        </p>

        <div className="mt-3 space-y-2 max-h-[44vh] overflow-y-auto pr-1">
          {KEYBIND_ROWS.map((row) => {
            const isListening = listeningAction === row.action;
            const currentCode = keybinds[row.action];

            return (
              <div
                key={row.action}
                className={`p-3.5 border flex items-center justify-between gap-4 transition-colors ${
                  isListening
                    ? 'bg-amber-500/15 border-amber-400'
                    : row.highlight
                    ? 'bg-[#131B2E] border-cyan-500/40'
                    : 'bg-[#121826]/90 border-slate-800'
                }`}
              >
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-slate-100">
                    {row.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {row.desc}
                  </div>
                </div>

                <button
                  onClick={() => setListeningAction(isListening ? null : row.action)}
                  className={`min-w-[140px] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest border transition-all cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-amber-400 text-slate-950 border-amber-200 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-500/50'
                  }`}
                >
                  {isListening ? 'NHẤN 1 PHÍM...' : `[ ${formatKeyLabel(currentCode)} ]`}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-widest border border-slate-700 transition-colors cursor-pointer"
          >
            KHÔI PHỤC MẶC ĐỊNH (WASD + Q LƯỚT + E OVERDRIVE)
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
          >
            LƯU THIẾT LẬP
          </button>
        </div>
      </div>
    </div>
  );
};
