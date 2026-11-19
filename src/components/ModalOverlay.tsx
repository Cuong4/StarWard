import { Rocket, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { GAME_MODES, SHIPS } from '../game/catalog';
import { GameState, HudSnapshot } from '../game/types';

interface ModalOverlayProps {
  gameState: Extract<GameState, 'PAUSED' | 'GAME_OVER'>;
  hud: HudSnapshot;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onOpenHangar: () => void;
  onReturnToTitle: () => void;
  onToggleMute: () => void;
}

export function ModalOverlay({
  gameState,
  hud,
  muted,
  onResume,
  onRestart,
  onOpenHangar,
  onReturnToTitle,
  onToggleMute,
}: ModalOverlayProps) {
  const isPaused = gameState === 'PAUSED';
  const modeInfo = GAME_MODES.find((m) => m.id === hud.mode) ?? GAME_MODES[0];
  const shipInfo = SHIPS[hud.shipId] ?? SHIPS.vanguard;
  const stats = hud.liveStats;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#05080F]/82"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-[#0F172A] border border-slate-700/80 p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-mono text-amber-400 mb-1">
              {modeInfo.name.toUpperCase()} · {shipInfo.name.toUpperCase()} ({hud.hp}/{hud.maxHp} HP)
            </div>
            <h2 id="game-modal-title" className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
              {isPaused ? 'Tạm Dừng Chiến Dịch' : 'Tổng Kết Chiến Dịch'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isPaused
                ? 'Nhấn Esc hoặc Tiếp Tục để quay lại chiến trường.'
                : hud.isNewBest
                ? 'Chúc mừng! Bạn vừa thiết lập kỷ lục điểm số mới.'
                : 'Thanh Máu (HP) của chiến cơ đã cạn kiệt. Mảnh Sao đã được chuyển về Hangar.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer shrink-0"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 border-y border-slate-800 py-3.5">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Điểm Trận Này</div>
            <div className="font-mono text-xl font-bold text-slate-50 tabular-nums">
              {hud.score.toLocaleString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Kỷ Lục Chế Độ</div>
            <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
              {hud.bestScore.toLocaleString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Mảnh Sao Thu Được</div>
            <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>+{hud.runShards.toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Đợt Đạt Được</div>
            <div className="font-mono text-base font-semibold text-slate-200 tabular-nums">
              Đợt {String(hud.wave).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Quái Đã Hạ</div>
            <div className="font-mono text-base font-semibold text-slate-200 tabular-nums">
              {hud.enemiesDefeated.toLocaleString('vi-VN')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Boss Đã Diệt</div>
            <div className="font-mono text-base font-semibold text-rose-400 tabular-nums">
              {hud.bossesDefeated.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Live Upgraded Combat Stats Summary in Pause / Game Over */}
        <div className="mb-4 p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30">
          <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-300 font-bold mb-2">
            ⚡ CHỈ SỐ ĐÃ NÂNG CẤP TRONG TRẬN
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">Sát Thương</span>
              <span className="text-amber-300 font-bold">
                {stats.damageBonusPct >= 0 ? `+${stats.damageBonusPct}%` : `${stats.damageBonusPct}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Tốc Độ Bắn</span>
              <span className="text-cyan-300 font-bold">
                {stats.fireRateBonusPct >= 0 ? `+${stats.fireRateBonusPct}%` : `${stats.fireRateBonusPct}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Tốc Độ Bay</span>
              <span className="text-emerald-300 font-bold">
                {stats.speedBonusPct >= 0 ? `+${stats.speedBonusPct}%` : `${stats.speedBonusPct}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Máu Cộng Thêm</span>
              <span className="text-emerald-400 font-bold">+{stats.bonusMaxHp} HP (+{stats.hpRegenPerSec}/s)</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Đạn &amp; Xuyên Phá</span>
              <span className="text-purple-300 font-bold">+{stats.extraBarrels} Nòng · +{stats.bonusPierce} Xuyên</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Hồi Lướt &amp; Hút</span>
              <span className="text-yellow-300 font-bold">{stats.dashCooldownSec}s · {stats.magnetRadiusPx}px</span>
            </div>
          </div>
        </div>

        {/* Active Perks collected during the run */}
        {hud.activePerks.length > 0 && (
          <div className="mb-5">
            <div className="text-xs text-slate-400 mb-1">
              Lõi nâng cấp đã lắp trong trận ({hud.activePerks.length}):
            </div>
            <div className="text-xs text-cyan-200 leading-relaxed">
              {hud.activePerks.join(' · ')}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isPaused ? (
            <button
              type="button"
              onClick={onResume}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-base transition-[transform,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 cursor-pointer whitespace-nowrap"
            >
              Tiếp Tục Chiến Đấu
            </button>
          ) : (
            <button
              type="button"
              onClick={onRestart}
              className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-base transition-[transform,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 cursor-pointer whitespace-nowrap"
            >
              Chơi Lại Ngay
            </button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {isPaused ? (
              <button
                type="button"
                onClick={onRestart}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer whitespace-nowrap"
              >
                Chơi Lại Từ Đầu
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenHangar}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer whitespace-nowrap"
              >
                <Rocket className="w-4 h-4" />
                <span>Xưởng Chiến Cơ Hangar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onReturnToTitle}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer whitespace-nowrap"
            >
              Màn Hình Chính
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
