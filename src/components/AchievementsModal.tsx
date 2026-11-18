import { Award, CheckCircle2, Sparkles, X } from 'lucide-react';
import { ACHIEVEMENTS } from '../game/catalog';
import { PlayerProfile } from '../game/types';

interface AchievementsModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

export function AchievementsModal({ profile, onClose }: AchievementsModalProps) {
  const unlockedCount = Object.keys(profile.achievements).length;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05080F]/85"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#0F172A] border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-800">
          <div>
            <h2 id="achievements-modal-title" className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
              Bảng Thành Tích & Hồ Sơ Chiến Công
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Đã chinh phục {unlockedCount} / {ACHIEVEMENTS.length} cột mốc chiến dịch. Mỗi thành tích thưởng thêm Mảnh Sao.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng thành tích"
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lifetime Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs text-slate-400 mb-1">Tổng Số Trận</div>
            <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
              {profile.stats.totalRuns.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs text-slate-400 mb-1">Kẻ Địch Hạ Gục</div>
            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {profile.stats.totalKills.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs text-slate-400 mb-1">Boss Đã Tiêu Diệt</div>
            <div className="font-mono text-lg font-bold text-rose-400 tabular-nums">
              {profile.stats.totalBossKills.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-3.5">
            <div className="text-xs text-slate-400 mb-1">Đợt Cao Nhất</div>
            <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">
              Đợt {String(profile.stats.highestWave).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Achievement list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ACHIEVEMENTS.map((ach) => {
            const unlockedAt = profile.achievements[ach.id];
            const isUnlocked = Boolean(unlockedAt);

            return (
              <div
                key={ach.id}
                className={`rounded-lg border p-4 flex items-start justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-[#0B111E] border-emerald-500/45'
                    : 'bg-[#0B111E]/60 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isUnlocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-slate-100">
                      {ach.title}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs text-amber-400 tabular-nums shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{ach.rewardShards}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
