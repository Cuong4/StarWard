import { Crosshair, Shield, Sparkles, Zap } from 'lucide-react';
import { PerkDefinition } from '../game/types';

interface PerkSelectModalProps {
  waveCleared: number;
  choices: PerkDefinition[];
  onSelectPerk: (perkId: string) => void;
}

const RARITY_LABEL: Record<PerkDefinition['rarity'], { label: string; colorClass: string }> = {
  common: { label: 'Thường', colorClass: 'text-slate-300 border-slate-700 hover:border-slate-500' },
  rare: { label: 'Hiếm', colorClass: 'text-sky-300 border-sky-500/40 hover:border-sky-400' },
  epic: { label: 'Sử Thi', colorClass: 'text-amber-300 border-amber-500/45 hover:border-amber-400' },
};

export function PerkSelectModal({ waveCleared, choices, onSelectPerk }: PerkSelectModalProps) {
  const getCategoryIcon = (category: PerkDefinition['category']) => {
    switch (category) {
      case 'Vũ Khí':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Hỏa Lực':
        return <Crosshair className="w-5 h-5 text-rose-400" />;
      case 'Phòng Thủ':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'Cơ Động':
        return <Zap className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-4 bg-[#05080F]/85"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perk-modal-title"
    >
      <div className="w-full max-w-3xl rounded-xl bg-[#0F172A] border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-xs font-mono text-amber-400 mb-1">
            HOÀN THÀNH ĐỢT {String(waveCleared).padStart(2, '0')} · TIẾP TẾ CHIẾN THUẬT
          </div>
          <h2 id="perk-modal-title" className="font-display text-2xl sm:text-3xl font-bold text-slate-50">
            Chọn 1 Nâng Cấp Chiến Cơ
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Nhấn chuột vào thẻ hoặc bấm phím <span className="font-mono text-slate-200">1</span>,{' '}
            <span className="font-mono text-slate-200">2</span>,{' '}
            <span className="font-mono text-slate-200">3</span> để trang bị ngay và bước vào đợt tiếp theo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {choices.map((perk, idx) => {
            const rarityInfo = RARITY_LABEL[perk.rarity];
            return (
              <button
                key={perk.id}
                type="button"
                onClick={() => onSelectPerk(perk.id)}
                className={`group flex flex-col justify-between text-left rounded-lg bg-[#0B111E] border p-5 transition-[transform,border-color,background-color] duration-150 hover:-translate-y-0.5 hover:bg-slate-900/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer ${rarityInfo.colorClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-slate-800/80">
                      {getCategoryIcon(perk.category)}
                    </div>
                    <span className="font-mono text-xs text-slate-400">
                      Phím [{idx + 1}]
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mb-1">
                    {perk.category} · <span className="font-medium">{rarityInfo.label}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-50 group-hover:text-amber-300 transition-colors mb-2">
                    {perk.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {perk.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/90 flex items-center justify-between text-xs font-medium text-amber-400">
                  <span>Trang bị ngay</span>
                  <span aria-hidden="true">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
