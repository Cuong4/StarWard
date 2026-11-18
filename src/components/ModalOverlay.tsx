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

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#05080F]/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-[#0F172A] border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-mono text-amber-400 mb-1">
              {modeInfo.name.toUpperCase()} · {shipInfo.name.toUpperCase()}
            </div>
            <h2 id="game-modal-title" className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
              {isPaused ? 'Tạm Dừng Chiến Dịch' : 'Tổng Kết Chiến Dịch'}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {isPaused
                ? 'Nhấn Esc hoặc Tiếp Tục để quay lại chiến trường.'
                : hud.isNewBest
                ? 'Chúc mừng! Bạn vừa thiết lập kỷ lục điểm số mới.'
                : 'Lớp khiên bảo vệ đã cạn kiệt. Mảnh Sao đã được chuyển về Hangar.'}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-5 border-y border-slate-800 py-4">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Điểm Trận Này</div>
            <div className="font-mono text-xl font-bold text-slate-50 tabular-nums">
              {hud.score.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Kỷ Lục Chế Độ</div>
            <div className="font-mono text-xl font-bold text-amber-400 tabular-nums">
              {hud.bestScore.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Mảnh Sao Thu Được</div>
            <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>+{hud.runShards.toLocaleString()}</span>
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
              {hud.enemiesDefeated.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Boss Đã Diệt</div>
            <div className="font-mono text-base font-semibold text-rose-400 tabular-nums">
              {hud.bossesDefeated.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Active Perks collected during the run */}
        {hud.activePerks.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-slate-400 mb-1.5">
              Nâng cấp đã trang bị trong trận ({hud.activePerks.length}):
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
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
                <span>Nâng Cấp Hangar</span>
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
