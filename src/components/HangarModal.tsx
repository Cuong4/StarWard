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
  <svg width={size} height={size} viewBox="-26 -26 52 52" className="shrink-0">
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
    {id === 'omega' && (
      <>
        <circle cx="-2" cy="0" r="18" fill="none" stroke={color} strokeWidth="1.3" strokeDasharray="5 3" />
        <polygon points="22,-4 12,-4 7,-16 -14,-14 -10,-4 -17,0 -10,4 -14,14 7,16 12,4 22,4 17,0" fill="rgba(7,9,14,0.95)" stroke={color} strokeWidth="1.9" />
        <circle cx="2" cy="0" r="5" fill={color} />
      </>
    )}
    {id === 'celestia' && (
      <>
        <circle cx="-3" cy="0" r="19" fill="none" stroke="#FDE047" strokeWidth="1.4" />
        <polygon points="23,0 8,-6 2,-19 -5,-10 -15,-17 -10,-4 -18,0 -10,4 -15,17 -5,10 2,19 8,6" fill="rgba(7,9,14,0.95)" stroke={color} strokeWidth="1.9" />
        <polygon points="11,0 0,-6 -6,0 0,6" fill={color} />
      </>
    )}
    {id === 'leviathan' && (
      <>
        <polygon points="23,-5 11,-2 23,5 5,11 -4,20 -16,12 -11,4 -19,0 -11,-4 -16,-12 -4,-20 5,-11" fill="rgba(7,9,14,0.95)" stroke={color} strokeWidth="2" />
        <circle cx="1" cy="0" r="5.5" fill={color} />
      </>
    )}
    {id === 'hyperion' && (
      <>
        <rect x="-15" y="-15" width="30" height="30" fill="none" stroke="#FACC15" strokeWidth="1.3" transform="rotate(45)" />
        <polygon points="24,0 6,-7 2,-21 -5,-8 -19,-13 -10,0 -19,13 -5,8 2,21 6,7" fill="rgba(7,9,14,0.95)" stroke={color} strokeWidth="2" />
        <circle cx="2" cy="0" r="5" fill="#FDE047" />
      </>
    )}
    {id === 'apocalypse' && (
      <>
        <circle cx="-2" cy="0" r="22" fill="none" stroke="#FACC15" strokeWidth="1.6" />
        <polygon points="25,0 13,-7 16,-15 2,-21 -6,-12 -18,-19 -13,-6 -21,0 -13,6 -18,19 -6,12 2,21 16,15 13,7" fill="rgba(7,9,14,0.95)" stroke={color} strokeWidth="2.1" />
        <polygon points="13,0 -3,-7 -7,0 -3,7" fill="#FACC15" />
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
        className="w-full max-w-6xl bg-[#0D111A] border border-slate-700/80 p-5 md:p-7 shadow-2xl my-auto max-h-[92vh] flex flex-col"
        style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))' }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400">
              TRẠM QUÂN GIỚI &amp; ĐỘI HÌNH 15 CHIẾN CƠ HUYỀN THOẠI
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-slate-100 mt-0.5">
              XƯỞNG CHIẾN CƠ HANGAR (NÂNG CẤP VÔ HẠN)
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
        <div className="flex flex-wrap gap-2 mt-4 border-b border-slate-800/80 pb-3 shrink-0">
          <button
            onClick={() => setTab('ships')}
            className={`px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              tab === 'ships'
                ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            ĐỘI HÌNH 15 CHIẾN CƠ ({profile.unlockedShips.length}/{SHIP_LIST.length})
          </button>
          <button
            onClick={() => setTab('upgrades')}
            className={`px-5 py-2.5 font-display text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
              tab === 'upgrades'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            NÂNG CẤP LÕI VĨNH VIỄN (KHÔNG GIỚI HẠN CẤP)
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pr-1 mt-4 flex-1">
          {tab === 'ships' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {SHIP_LIST.map((ship) => {
                const unlocked = profile.unlockedShips.includes(ship.id);
                const selected = profile.selectedShip === ship.id;
                const canAfford = profile.starShards >= ship.cost;
                const defaultWeapon = WEAPONS[ship.defaultWeapon];
                const isMythic = ship.cost >= 28000;

                return (
                  <div
                    key={ship.id}
                    className={`p-5 bg-[#121826]/95 border transition-all flex flex-col justify-between ${
                      selected
                        ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                        : isMythic
                        ? 'border-amber-500/45 hover:border-amber-400'
                        : unlocked
                        ? 'border-slate-700/80 hover:border-slate-500'
                        : 'border-slate-800/80 opacity-95'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-[10px] uppercase tracking-widest font-bold"
                              style={{ color: ship.accentColor }}
                            >
                              {ship.role}
                            </span>
                            {isMythic && (
                              <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold">
                                ★ SIÊU CẤP THẦN THOẠI
                              </span>
                            )}
                          </div>
                          <h3 className="font-display text-lg font-bold uppercase tracking-wide text-slate-100 mt-0.5">
                            {ship.name}
                          </h3>
                        </div>

                        {/* Visual Ship Badge */}
                        <div
                          className="w-14 h-14 flex items-center justify-center border bg-slate-950/90 shrink-0"
                          style={{ borderColor: ship.accentColor }}
                        >
                          <ShipSvgIcon id={ship.id} color={ship.accentColor} size={42} />
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {ship.description}
                      </p>

                      {/* 3 Distinct Skills Callout: [Q] Dash, Hold-[Q] Charge-Burst, and [E] 10s 3D Overdrive */}
                      <div className="mt-3 space-y-2">
                        {/* 1. Tap [Q] Dash Skill */}
                        <div
                          className="p-2.5 bg-slate-950/90 border-l-2"
                          style={{ borderColor: ship.dashColor }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                              KỸ NĂNG LƯỚT [Q] ĐỘC BẢN
                            </span>
                            <span
                              className="font-display text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: ship.dashColor }}
                            >
                              ⚡ {ship.dashEffectName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            {ship.dashEffectDesc}
                          </p>
                        </div>

                        {/* 2. Hold [Q] Charge-Burst Skill */}
                        <div className="p-2.5 bg-slate-950/90 border-l-2 border-amber-400">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300/90">
                              ĐÈ GIỮ [Q] TỤ LỰC BÙNG PHÁ (1 GIÂY)
                            </span>
                            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-amber-300">
                              🔥 {ship.chargeSkillName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            {ship.chargeSkillDesc}
                          </p>
                        </div>

                        {/* 3. [E] 10-Second 3D Overdrive Ultimate */}
                        <div
                          className="p-2.5 bg-slate-950/90 border-l-2"
                          style={{ borderColor: ship.dashSecondaryColor }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-rose-300">
                              TUYỆT KỸ NỘ [E] BÙNG NỔ 10 GIÂY
                            </span>
                            <span
                              className="font-display text-[11px] font-bold uppercase tracking-wider"
                              style={{ color: ship.accentColor }}
                            >
                              ✦ {ship.overdriveEffectName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                            {ship.overdriveEffectDesc}
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 text-[9px] block">MÁU GỐC (HP)</span>
                          <span className="text-emerald-300 font-bold tabular-nums">{ship.baseHp} HP</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">SÁT THƯƠNG</span>
                          <span className="text-amber-300 font-bold tabular-nums">{Math.round(ship.damageMult * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">TỐC ĐỘ BẮN</span>
                          <span className="text-cyan-300 font-bold tabular-nums">{Math.round(ship.fireRateMult * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] block">KÍCH CỠ HẦM HỐ</span>
                          <span className="text-slate-200 font-bold tabular-nums">{Math.round((ship.hullScale ?? 1) * 100)}%</span>
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
                          className={`w-full py-2.5 font-display text-xs font-bold uppercase tracking-widest border transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]'
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
                const cost = getUpgradeCost(u, currentLevel);
                const canAfford = profile.starShards >= cost;

                return (
                  <div
                    key={u.id}
                    className="p-5 bg-[#121826]/95 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold">
                          CẤP HIỆN TẠI: LV.{currentLevel} (VÔ HẠN)
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

                      {/* Dynamic tier bar (fills every 10 levels and shows tier prestige) */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                          <span>BẬC ĐỘT PHÁ #{Math.floor(currentLevel / 10) + 1}</span>
                          <span className="text-cyan-300 font-bold">Tổng Cấp: {currentLevel}</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 10 }).map((_, idx) => {
                            const filled = idx < currentLevel % 10 || (currentLevel > 0 && currentLevel % 10 === 0);
                            return (
                              <div
                                key={idx}
                                className={`h-1.5 flex-1 ${
                                  filled ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-800'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyUpgrade(u.id, cost)}
                        className={`w-full py-2.5 font-display text-xs font-bold uppercase tracking-widest border transition-all ${
                          canAfford
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-cyan-200 cursor-pointer'
                            : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        NÂNG LÊN CẤP {currentLevel + 1} — ✦ {cost.toLocaleString('vi-VN')}
                      </button>
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
