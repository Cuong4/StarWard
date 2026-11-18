import React, { useState } from 'react';
import { HangarUpgradeId, PlayerProfile, ShipId } from '../game/types';
import { HANGAR_UPGRADES, SHIP_LIST, WEAPONS, getUpgradeCost } from '../game/catalog';

interface HangarModalProps {
  profile: PlayerProfile;
  onSelectShip: (id: ShipId) => void;
  onUnlockShip: (id: ShipId, cost: number) => void;
  onBuyUpgrade: (id: HangarUpgradeId, cost: number) => void;
  onClose: () => void;
}

export const ShipSvgIcon: React.FC<{ id: ShipId; color: string; size?: number }> = ({ id, color, size = 34 }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40" className="shrink-0">
    {id === 'vanguard' && (
      <>
        <polygon points="16,0 -11,-12 -6,0 -11,12" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <polygon points="7,0 -4,-4 -4,4" fill={color} />
      </>
    )}
    {id === 'phantom' && (
      <>
        <polygon points="18,0 -8,-14 -3,-4 -13,0 -3,4 -8,14" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <polygon points="8,0 -5,-3 -5,3" fill={color} />
      </>
    )}
    {id === 'valkyrie' && (
      <>
        <polygon points="19,0 3,-5 -10,-15 -6,-3 -13,0 -6,3 -10,15 3,5" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <polygon points="10,0 -3,-3 -3,3" fill={color} />
      </>
    )}
    {id === 'titan' && (
      <>
        <polygon points="15,-4 15,4 4,14 -12,14 -12,-14 4,-14" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <rect x="-5" y="-5" width="10" height="10" fill={color} />
      </>
    )}
    {id === 'tempest' && (
      <>
        <polygon points="17,0 2,-13 -12,-9 -5,0 -12,9 2,13" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <circle cx="2" cy="0" r="4.5" fill={color} />
      </>
    )}
    {id === 'eclipse' && (
      <>
        <polygon points="16,0 5,-14 -14,-11 -6,0 -14,11 5,14" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <circle cx="1" cy="0" r="4.5" fill={color} />
      </>
    )}
    {id === 'nova' && (
      <>
        <polygon points="17,0 4,-6 0,-15 -6,-6 -15,0 -6,6 0,15 4,6" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <circle cx="0" cy="0" r="4" fill={color} />
      </>
    )}
    {id === 'solaris' && (
      <>
        <polygon points="19,0 5,-6 -3,-17 -7,-5 -15,0 -7,5 -3,17 5,6" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <polygon points="9,0 0,-4 -5,0 0,4" fill={color} />
      </>
    )}
    {id === 'aether' && (
      <>
        <polygon points="18,0 2,-14 -15,0 2,14" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <polygon points="9,0 1,-6 -6,0 1,6" fill={color} />
      </>
    )}
    {id === 'chronos' && (
      <>
        <polygon points="18,0 6,-12 -4,-4 -14,-13 -10,0 -14,13 -4,4 6,12" fill="rgba(7,9,14,0.9)" stroke={color} strokeWidth="1.8" />
        <circle cx="2" cy="0" r="4.5" fill={color} />
      </>
    )}
  </svg>
);

export const HangarModal: React.FC<HangarModalProps> = ({
  profile,
  onSelectShip,
  onUnlockShip,
  onBuyUpgrade,
  onClose,
}) => {
  const [tab, setTab] = useState<'ships' | 'upgrades'>('ships');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#07090E]/88 p-4 overflow-y-auto">
      <div
        className="w-full max-w-5xl bg-[#0D111A] border border-slate-700/80 p-6 md:p-7 shadow-2xl my-auto max-h-[92vh] flex flex-col"
        style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400">
              TRẠM QUÂN GIỚI &amp; ĐỘI HÌNH 10 CHIẾN CƠ
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-slate-100 mt-0.5">
              XƯỞNG CHIẾN CƠ HANGAR
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2 text-right">
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-400">MẢNH SAO HIỆN CÓ</div>
              <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
                ✦ {profile.starShards.toLocaleString('vi-VN')}
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-mono text-xs uppercase tracking-widest border border-slate-600/50 transition-colors cursor-pointer"
            >
              ĐÓNG [ESC]
            </button>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex gap-2 mt-4 border-b border-slate-800/80 pb-3 shrink-0">
          <button
            onClick={() => setTab('ships')}
            className={`px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              tab === 'ships'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            ĐỘI HÌNH 10 CHIẾN CƠ ({profile.unlockedShips.length}/{SHIP_LIST.length})
          </button>
          <button
            onClick={() => setTab('upgrades')}
            className={`px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              tab === 'upgrades'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            NÂNG CẤP LÕI VĨNH VIỄN
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 mt-4 flex-1">
          {tab === 'ships' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHIP_LIST.map((ship) => {
                const unlocked = profile.unlockedShips.includes(ship.id);
                const selected = profile.selectedShip === ship.id;
                const canAfford = profile.starShards >= ship.cost;
                const defaultWeapon = WEAPONS[ship.defaultWeapon];

                return (
                  <div
                    key={ship.id}
                    className={`p-5 bg-[#121826]/95 border transition-all flex flex-col justify-between ${
                      selected
                        ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.16)]'
                        : unlocked
                        ? 'border-slate-700/80 hover:border-slate-500'
                        : 'border-slate-800/80 opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: ship.accentColor }}>
                            {ship.role}
                          </div>
                          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100 mt-0.5">
                            {ship.name}
                          </h3>
                        </div>

                        {/* Visual Ship Badge */}
                        <div
                          className="w-12 h-12 flex items-center justify-center border bg-slate-950/90 shrink-0"
                          style={{ borderColor: ship.accentColor }}
                        >
                          <ShipSvgIcon id={ship.id} color={ship.accentColor} size={34} />
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {ship.description}
                      </p>

                      {/* Unique Dash Effect Callout */}
                      <div
                        className="mt-3 p-2.5 bg-slate-950/90 border-l-2"
                        style={{ borderColor: ship.dashColor }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                            TUYỆT KỸ LƯỚT ĐẶC TRƯNG
                          </span>
                          <span
                            className="font-display text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: ship.dashColor }}
                          >
                            ⚡ {ship.dashEffectName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                          {ship.dashEffectDesc}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 text-[9px] block">SINH MẠNG</span>
                          <span className="text-slate-200 font-bold tabular-nums">{ship.baseShields} KHIÊN</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">TỐC ĐỘ BAY</span>
                          <span className="text-slate-200 font-bold tabular-nums">{Math.round(ship.speedMult * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">SÁT THƯƠNG</span>
                          <span className="text-slate-200 font-bold tabular-nums">{Math.round(ship.damageMult * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">VŨ KHÍ GỐC</span>
                          <span className="font-bold" style={{ color: defaultWeapon.color }}>
                            {defaultWeapon.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {unlocked ? (
                        selected ? (
                          <span className="w-full py-2 text-center bg-amber-500/20 border border-amber-400/60 text-amber-300 font-display text-xs font-bold uppercase tracking-widest">
                            ✓ ĐANG XUẤT KÍCH
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectShip(ship.id)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-display text-xs font-bold uppercase tracking-widest border border-slate-600 transition-colors cursor-pointer"
                          >
                            CHỌN CHIẾN CƠ NÀY
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => onUnlockShip(ship.id, ship.cost)}
                          className={`w-full py-2 font-display text-xs font-bold uppercase tracking-widest border transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 cursor-pointer'
                              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          MỞ KHÓA — ✦ {ship.cost.toLocaleString('vi-VN')} MẢNH SAO
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HANGAR_UPGRADES.map((u) => {
                const currentLevel = profile.hangarLevels[u.id] || 0;
                const isMax = currentLevel >= u.maxLevel;
                const cost = getUpgradeCost(u, currentLevel);
                const canAfford = !isMax && profile.starShards >= cost;

                return (
                  <div
                    key={u.id}
                    className="p-4 bg-[#121826]/95 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
                          CẤP {currentLevel} / {u.maxLevel}
                        </span>
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {u.unitLabel}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-bold uppercase tracking-wide text-slate-100 mt-1">
                        {u.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {u.description}
                      </p>

                      {/* Level indicator bars */}
                      <div className="flex gap-1 mt-4">
                        {Array.from({ length: u.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 flex-1 ${
                              idx < currentLevel ? 'bg-cyan-400' : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      {isMax ? (
                        <div className="w-full py-2 text-center bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-xs uppercase tracking-widest">
                          ĐÃ ĐẠT CẤP TỐI ĐA
                        </div>
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => onBuyUpgrade(u.id, cost)}
                          className={`w-full py-2 font-display text-xs font-bold uppercase tracking-widest border transition-all ${
                            canAfford
                              ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-200 cursor-pointer'
                              : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          NÂNG CẤP — ✦ {cost.toLocaleString('vi-VN')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
