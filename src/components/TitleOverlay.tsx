import React from 'react';
import { GameMode, PlayerProfile } from '../game/types';
import { ACHIEVEMENTS, GAME_MODES, SHIPS, WEAPONS, formatKeyLabel } from '../game/catalog';
import { ShipSvgIcon } from './HangarModal';

interface TitleOverlayProps {
  profile: PlayerProfile;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStart: () => void;
  onOpenHangar: () => void;
  onOpenAchievements: () => void;
  onOpenKeybinds: () => void;
  onOpenPcDownload: () => void;
}

export const TitleOverlay: React.FC<TitleOverlayProps> = ({
  profile,
  selectedMode,
  onSelectMode,
  onStart,
  onOpenHangar,
  onOpenAchievements,
  onOpenKeybinds,
  onOpenPcDownload,
}) => {
  const currentShip = SHIPS[profile.selectedShip] || SHIPS.vanguard;
  const currentWeapon = WEAPONS[currentShip.defaultWeapon];
  const dashKey = formatKeyLabel(profile.keybinds.dash);
  const overdriveKey = formatKeyLabel(profile.keybinds.overdrive);
  const bestScore = Math.max(
    profile.bestScores.arcade || 0,
    profile.bestScores.boss_rush || 0,
    profile.bestScores.hardcore || 0
  );
  const unlockedAchievementCount = Object.keys(profile.achievements).length;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#07090E]/75 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#0D111A]/95 border border-slate-700/80 p-6 md:p-9 shadow-[0_0_70px_rgba(245,158,11,0.14)] my-auto"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px))',
        }}
      >
        {/* Top corner accent */}
        <div className="absolute top-0 left-0 w-24 h-1 bg-amber-500" />
        <div className="absolute top-0 left-0 w-1 h-24 bg-amber-500" />

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/90 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-block w-2 h-2 bg-amber-400" />
              <span className="font-mono text-xs uppercase tracking-[0.28em] text-amber-400">
                STARWARD COMMAND // PHIÊN BẢN PC CHIẾN THUẬT
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight text-slate-50 leading-none">
              STAR<span className="text-amber-400">WARD</span>
            </h1>
            <p className="font-display text-xs uppercase tracking-[0.22em] text-cyan-400 mt-1.5">
              CHIẾN TRƯỜNG TINH HÀ • 10 CHIẾN CƠ • 8 CHIẾN KHU BIẾN ĐỔI
            </p>
          </div>

          {/* Player Resource & Record Summary */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2.5 text-right">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">
                KHO MẢNH SAO
              </span>
              <span className="font-mono text-lg font-bold text-amber-400 tabular-nums">
                ✦ {profile.starShards.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 text-right">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">
                KỶ LỤC ĐIỂM SỐ
              </span>
              <span className="font-mono text-lg font-bold text-slate-100 tabular-nums">
                {bestScore.toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 mb-2.5">
            CHỌN CHẾ ĐỘ CHIẾN ĐẤU
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GAME_MODES.map((m) => {
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(m.id)}
                  className={`p-3.5 text-left border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#151D2E] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-cyan-400">
                      {m.shardMultiplier}
                    </span>
                    {active && (
                      <span className="font-mono text-[10px] text-amber-400 font-bold">● ĐÃ CHỌN</span>
                    )}
                  </div>
                  <div className="font-display text-base font-bold uppercase tracking-wide text-slate-100 mt-1">
                    {m.name}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Ship & Unique Dash Preview Card */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/75 border border-slate-800/90 p-4">
          <div className="md:col-span-7 flex items-start gap-3.5">
            <div
              className="w-14 h-14 flex items-center justify-center border bg-slate-950/90 shrink-0 mt-0.5"
              style={{ borderColor: currentShip.accentColor }}
            >
              <ShipSvgIcon id={currentShip.id} color={currentShip.accentColor} size={38} />
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400 block">
                CHIẾN CƠ ĐANG TRANG BỊ ({profile.unlockedShips.length}/10 ĐÃ MỞ)
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span
                  className="font-display text-base font-bold uppercase tracking-wider"
                  style={{ color: currentShip.accentColor }}
                >
                  {currentShip.name}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs text-slate-300">
                  {currentWeapon.name}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-950 border"
                  style={{ color: currentShip.dashColor, borderColor: `${currentShip.dashColor}66` }}
                >
                  LƯỚT [{dashKey}]: {currentShip.dashEffectName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentShip.dashEffectDesc}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400 block">
                CẤU HÌNH PHÍM TẮT PC HIỆN TẠI
              </span>
              <div className="font-mono text-xs text-slate-200 mt-1 space-y-1">
                <div>
                  • Lướt Chiến Thuật: <strong className="text-cyan-300">[{dashKey}]</strong> hoặc <strong className="text-cyan-300">[Chuột Phải]</strong>
                </div>
                <div>
                  • Chiêu Cuối Overdrive: <strong className="text-amber-400">[{overdriveKey}]</strong>
                </div>
                <div>
                  • Hạ địch rơi <strong className="text-emerald-400">4 loại Ngọc Boost</strong> &amp; đổi màu chiến khu mỗi Wave!
                </div>
              </div>
            </div>
            <button
              onClick={onOpenKeybinds}
              className="mt-2.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-widest border border-cyan-500/40 transition-colors cursor-pointer"
            >
              ⌨ TÙY CHỈNH NÚT ĐIỀU KHIỂN
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <button
            onClick={onStart}
            className="sm:col-span-5 py-4 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-black text-base uppercase tracking-[0.18em] transition-all duration-150 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
            }}
          >
            XUẤT KÍCH NGAY
          </button>

          <button
            onClick={onOpenHangar}
            className="sm:col-span-4 py-4 px-4 bg-[#141C2B] hover:bg-slate-800 text-cyan-300 font-display font-bold text-xs uppercase tracking-[0.15em] border border-cyan-500/40 transition-colors cursor-pointer"
          >
            XƯỞNG CHIẾN CƠ (10 TÀU)
          </button>

          <button
            onClick={onOpenAchievements}
            className="sm:col-span-3 py-4 px-4 bg-[#141C2B] hover:bg-slate-800 text-slate-200 font-display font-bold text-xs uppercase tracking-[0.15em] border border-slate-700 transition-colors cursor-pointer"
          >
            THÀNH TÍCH ({unlockedAchievementCount}/{ACHIEVEMENTS.length})
          </button>
        </div>

        {/* PC .EXE Download Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-400 inline-block shrink-0" />
            <span className="font-mono text-xs text-slate-300">
              Tải bản cài đặt PC (.EXE) để chiến độc lập trên Windows không cần trình duyệt!
            </span>
          </div>
          <button
            onClick={onOpenPcDownload}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 text-amber-300 font-display text-xs font-bold uppercase tracking-widest border border-amber-400/60 transition-all cursor-pointer shrink-0"
          >
            ⬇ TẢI BẢN PC (.EXE)
          </button>
        </div>
      </div>
    </div>
  );
};
