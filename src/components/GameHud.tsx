import React, { useState } from 'react';
import { DashDirectionMode, HudSnapshot, KeybindConfig } from '../game/types';
import { GAME_MODES, SHIPS, WEAPONS, formatKeyLabel } from '../game/catalog';

interface GameHudProps {
  hud: HudSnapshot;
  keybinds: KeybindConfig;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onOpenKeybinds: () => void;
  onToggleDashDirection: (nextMode: DashDirectionMode) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  keybinds,
  muted,
  onPause,
  onToggleMute,
  onOpenKeybinds,
  onToggleDashDirection,
}) => {
  const [showStatsPanel, setShowStatsPanel] = useState(true);

  const hpPercent = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const dashPercent = Math.max(0, Math.min(100, hud.dashCharge * 100));
  const holdChargePercent = Math.max(0, Math.min(100, (hud.holdChargeRatio || 0) * 100));
  const overdrivePercent = Math.max(0, Math.min(100, hud.overdriveCharge));
  const bossHpPercent = hud.boss ? Math.max(0, Math.min(100, (hud.boss.hp / hud.boss.maxHp) * 100)) : 0;

  const isCriticalHp = hpPercent <= 28;
  const weapon = WEAPONS[hud.weapon] ?? WEAPONS.pulse;
  const ship = SHIPS[hud.shipId] || SHIPS.vanguard;
  const modeInfo = GAME_MODES.find((m) => m.id === hud.mode);

  const dashKeyLabel = formatKeyLabel(keybinds.dash);
  const overdriveKeyLabel = formatKeyLabel(keybinds.overdrive);
  const stats = hud.liveStats;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3.5 md:p-5 select-none">
      {/* Top Row: Ship HP/Dash/Overdrive + Live Upgraded Stats | Sector & Boss | Score & Controls */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Column: Ship HP Bar, Dash/Hold-Charge, Overdrive 10s, and Live Upgraded Stats */}
        <div className="flex flex-col gap-2.5">
          <div
            className="bg-[#0D111A]/94 border border-slate-700/80 px-4 py-3 min-w-[295px] sm:min-w-[345px] shadow-xl"
            style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)' }}
          >
            {/* HP Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-200 font-bold">
                MÁU CHIẾN CƠ // {ship.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-emerald-400/90 tabular-nums">
                  +{stats.hpRegenPerSec} HP/s
                </span>
                <span
                  className={`font-mono text-xs font-black tabular-nums ${
                    isCriticalHp ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
                  }`}
                >
                  {hud.hp} / {hud.maxHp} HP
                </span>
              </div>
            </div>

            {/* Smooth + Segmented Tactical HP Bar */}
            <div className="relative h-3.5 w-full bg-slate-950 border border-slate-700/90 overflow-hidden p-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  isCriticalHp
                    ? 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-400 shadow-[0_0_12px_rgba(244,63,94,0.65)]'
                    : hpPercent <= 55
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
              {/* Tick marks every 20% */}
              <div className="absolute inset-0 flex justify-between pointer-events-none px-[20%]">
                <span className="w-px h-full bg-slate-950/65" />
                <span className="w-px h-full bg-slate-950/65" />
                <span className="w-px h-full bg-slate-950/65" />
                <span className="w-px h-full bg-slate-950/65" />
              </div>
            </div>

            {/* Dash Thruster Bar [Q] + Hold-[Q] Charge-Burst Indicator */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-mono text-[9px] uppercase tracking-[0.12em] font-bold"
                  style={{ color: ship.dashColor }}
                >
                  LƯỚT [{dashKeyLabel}] // {holdChargePercent > 5 ? `TỤ LỰC: ${ship.chargeSkillName}` : ship.dashEffectName}
                </span>
                <span className="font-mono text-[10px] text-cyan-300 tabular-nums font-bold">
                  {holdChargePercent > 5
                    ? `TỤ NĂNG LƯỢNG ${Math.floor(holdChargePercent)}%`
                    : dashPercent >= 100
                    ? `SẴN SÀNG (${stats.dashCooldownSec}s)`
                    : `${Math.floor(dashPercent)}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 overflow-hidden border border-slate-800 relative">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${dashPercent}%`,
                    backgroundColor: ship.dashColor,
                  }}
                />
                {holdChargePercent > 2 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-300 via-amber-400 to-white transition-all duration-75"
                    style={{ width: `${holdChargePercent}%` }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[9px] text-slate-400">
                  Đè giữ [{dashKeyLabel}] 1s: <strong className="text-amber-300">{ship.chargeSkillName}</strong>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onToggleDashDirection(hud.dashDirectionMode === 'mouse' ? 'movement' : 'mouse')
                  }
                  className="pointer-events-auto font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 cursor-pointer transition-colors"
                  title="Đổi hướng lướt: Theo con trỏ chuột hoặc theo hướng phím di chuyển WASD"
                >
                  HƯỚNG LƯỚT: {hud.dashDirectionMode === 'mouse' ? '🎯 THEO CHUỘT' : '⌨ THEO DI CHUYỂN'}
                </button>
              </div>
            </div>

            {/* Overdrive Ultimate Gauge [E] (Charges ONLY by dealing damage, lasts 10.0s) */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300 font-bold">
                  NỘ OVERDRIVE [{overdriveKeyLabel}] // {ship.overdriveEffectName}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold tabular-nums ${
                    hud.overdriveActive
                      ? 'text-amber-300 animate-pulse'
                      : overdrivePercent >= 100
                      ? 'text-emerald-400 animate-bounce'
                      : 'text-slate-300'
                  }`}
                >
                  {hud.overdriveActive
                    ? `BÙNG NỔ 3D (${hud.overdriveTimeLeft.toFixed(1)}s)`
                    : overdrivePercent >= 100
                    ? `NHẤN [${overdriveKeyLabel}] BÙNG NỔ 10 GIÂY!`
                    : `${overdrivePercent}% (GÂY DAME TÍCH NỘ)`}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-950 border border-amber-500/45 p-0.5">
                <div
                  className={`h-full transition-all duration-100 ${
                    hud.overdriveActive
                      ? 'bg-gradient-to-r from-amber-300 via-rose-400 to-cyan-300'
                      : overdrivePercent >= 100
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 shadow-[0_0_12px_rgba(250,204,21,0.65)]'
                      : 'bg-gradient-to-r from-amber-600 to-amber-400'
                  }`}
                  style={{
                    width: `${
                      hud.overdriveActive
                        ? Math.max(5, (hud.overdriveTimeLeft / 10) * 100)
                        : overdrivePercent
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Live Upgraded Stats In-Match Panel (Hiển thị chỉ số đã nâng cấp được bao nhiêu trong trận) */}
          <div className="bg-[#0D111A]/92 border border-cyan-500/40 px-3.5 py-2.5 min-w-[295px] sm:min-w-[345px] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-300 font-bold">
                ⚡ CHỈ SỐ ĐÃ NÂNG CẤP TRONG TRẬN
              </span>
              <button
                type="button"
                onClick={() => setShowStatsPanel((prev) => !prev)}
                className="pointer-events-auto font-mono text-[9px] uppercase tracking-wider text-slate-400 hover:text-cyan-300 cursor-pointer"
              >
                {showStatsPanel ? '[THU GỌN]' : '[MỞ RỘNG]'}
              </button>
            </div>

            {showStatsPanel && (
              <>
                <div className="grid grid-cols-3 gap-1.5 mt-2 pt-2 border-t border-slate-800/90 font-mono text-[10px]">
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">SÁT THƯƠNG</span>
                    <span className="text-amber-300 font-bold tabular-nums">
                      {stats.damageBonusPct >= 0 ? `+${stats.damageBonusPct}%` : `${stats.damageBonusPct}%`}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">TỐC ĐỘ BẮN</span>
                    <span className="text-cyan-300 font-bold tabular-nums">
                      {stats.fireRateBonusPct >= 0 ? `+${stats.fireRateBonusPct}%` : `${stats.fireRateBonusPct}%`}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">TỐC ĐỘ BAY</span>
                    <span className="text-emerald-300 font-bold tabular-nums">
                      {stats.speedBonusPct >= 0 ? `+${stats.speedBonusPct}%` : `${stats.speedBonusPct}%`}
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">MÁU CỘNG THÊM</span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      +{stats.bonusMaxHp} HP
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">NÒNG &amp; XUYÊN</span>
                    <span className="text-purple-300 font-bold tabular-nums">
                      +{stats.extraBarrels} Nòng · +{stats.bonusPierce} Xuyên
                    </span>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 px-2 py-1">
                    <span className="text-slate-400 text-[8px] block">TẦM HÚT &amp; NỘ</span>
                    <span className="text-yellow-300 font-bold tabular-nums">
                      {stats.magnetRadiusPx}px · +{stats.overdriveGainBonusPct}%
                    </span>
                  </div>
                </div>

                {/* Permanent Hangar Levels active in this match */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 font-mono text-[9px] text-slate-300">
                  <span>
                    Lõi Hangar:{' '}
                    <strong className="text-amber-300">Hỏa Lực Lv.{stats.hangarLevels.firepower ?? 0}</strong> ·{' '}
                    <strong className="text-emerald-300">Giáp Lv.{stats.hangarLevels.hull ?? 0}</strong> ·{' '}
                    <strong className="text-cyan-300">Động Cơ Lv.{stats.hangarLevels.thruster ?? 0}</strong> ·{' '}
                    <strong className="text-purple-300">Từ Trường Lv.{stats.hangarLevels.magnet ?? 0}</strong> ·{' '}
                    <strong className="text-rose-300">Lõi Nộ Lv.{stats.hangarLevels.overdrive ?? 0}</strong>
                  </span>
                </div>

                {hud.activePerks.length > 0 && (
                  <div className="mt-1 font-mono text-[9px] text-cyan-200/90 truncate">
                    Lõi Trận ({hud.activePerks.length}): {hud.activePerks.join(' • ')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Top-Center: Dynamic Sector Theme Badge, Boss Health Bar & Active Boosts */}
        <div className="hidden lg:flex flex-col items-center flex-1 max-w-xl mx-auto gap-2.5">
          {/* Dynamic Cosmic Sector Indicator */}
          <div
            className="bg-[#0D111A]/92 border px-5 py-1.5 flex items-center gap-3 shadow-md"
            style={{ borderColor: `${hud.sectorAccent}77` }}
          >
            <span
              className="w-2 h-2 rotate-45 inline-block"
              style={{ backgroundColor: hud.sectorAccent }}
            />
            <div className="text-center">
              <div
                className="font-display text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: hud.sectorAccent }}
              >
                {hud.sectorName}
              </div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                {hud.sectorSubtitle}
              </div>
            </div>
            <span
              className="w-2 h-2 rotate-45 inline-block"
              style={{ backgroundColor: hud.sectorAccent }}
            />
          </div>

          {/* Boss Health Bar */}
          {hud.boss && (
            <div
              className="w-full bg-[#140A12]/95 border border-rose-500/70 px-5 py-2.5 shadow-[0_0_30px_rgba(244,63,94,0.25)]"
              style={{ clipPath: 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%, 0 12px)' }}
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-rose-400 block">
                    ⚠ {hud.boss.subtitle} — GIAI ĐOẠN {hud.boss.phase}
                  </span>
                  <span className="font-display text-sm font-black uppercase tracking-wider text-slate-100">
                    {hud.boss.name}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-rose-300 tabular-nums">
                  {Math.ceil(hud.boss.hp).toLocaleString('vi-VN')} / {hud.boss.maxHp.toLocaleString('vi-VN')} HP
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 border border-rose-500/50 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-100"
                  style={{ width: `${bossHpPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Combat Boosts Bar */}
          {hud.activeBoosts.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {hud.activeBoosts.map((boost) => {
                const pct = Math.max(0, Math.min(100, (boost.remaining / boost.duration) * 100));
                return (
                  <div
                    key={boost.type}
                    className="bg-[#0D111A]/95 border px-3 py-1.5 min-w-[165px] shadow-md"
                    style={{ borderColor: boost.color }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-display text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: boost.color }}
                      >
                        ⚡ {boost.label}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-200 tabular-nums">
                        {boost.remaining.toFixed(1)}s
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-900 mt-1">
                      <div
                        className="h-full transition-all duration-75"
                        style={{ width: `${pct}%`, backgroundColor: boost.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top-Right: Score, Wave, Multiplier, Shards, PC Action Buttons */}
        <div className="flex items-start gap-2">
          <div
            className="bg-[#0D111A]/92 border border-slate-700/75 px-4 py-3 text-right min-w-[225px] shadow-lg"
            style={{ clipPath: 'polygon(14px 0, 100% 0, 100% 100%, 0 100%, 0 14px)' }}
          >
            <div className="flex items-center justify-end gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400 font-semibold">
                {modeInfo?.name || 'HÀNH TRÌNH'} • ĐỢT {String(hud.wave).padStart(2, '0')}
              </span>
              <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 tabular-nums">
                {hud.multiplier}x
              </span>
            </div>

            <div className="font-mono text-2xl font-bold text-slate-50 tracking-tight tabular-nums mt-0.5">
              {hud.score.toLocaleString('vi-VN')}
            </div>

            <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-slate-800/80">
              <span className="font-mono text-[10px] font-bold text-amber-400 tabular-nums">
                ✦ +{hud.runShards.toLocaleString('vi-VN')} MẢNH SAO
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-wider font-bold"
                style={{ color: weapon.color }}
              >
                {weapon.name} (LV.{hud.weaponLevel})
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={onPause}
              className="pointer-events-auto bg-[#0D111A]/92 hover:bg-slate-800/90 text-slate-200 hover:text-amber-400 border border-slate-700/75 px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title="Tạm dừng trận đấu"
            >
              II [{formatKeyLabel(keybinds.pause)}]
            </button>
            <button
              onClick={onOpenKeybinds}
              className="pointer-events-auto bg-[#0D111A]/92 hover:bg-slate-800/90 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              title="Tùy chỉnh phím tắt & hướng lướt"
            >
              ⌨ PHÍM
            </button>
            <button
              onClick={onToggleMute}
              className="pointer-events-auto bg-[#0D111A]/92 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? '🔇 TẮT' : '🔊 ÂM'}
            </button>
          </div>
        </div>
      </div>

      {/* Center Wave Transition Banner */}
      {hud.waveBanner && (
        <div className="self-center my-auto pointer-events-none text-center">
          <div
            className="bg-[#0D111A]/92 border-y-2 px-10 py-3 shadow-2xl"
            style={{ borderColor: hud.sectorAccent }}
          >
            <div
              className="font-mono text-[10px] uppercase tracking-[0.35em]"
              style={{ color: hud.sectorAccent }}
            >
              DỊCH CHUYỂN KHÔNG GIAN // {hud.sectorName}
            </div>
            <div className="font-display text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-50 mt-0.5">
              {hud.waveBanner}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Controls Help & Combat Counters */}
      <div className="flex items-end justify-between gap-4">
        <div className="bg-[#0D111A]/90 border border-slate-800/90 px-3.5 py-2 font-mono text-[11px] text-slate-300 tracking-wider uppercase flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-amber-400">
              [{formatKeyLabel(keybinds.up)}/{formatKeyLabel(keybinds.left)}/{formatKeyLabel(keybinds.down)}/{formatKeyLabel(keybinds.right)}]
            </strong>{' '}
            Di chuyển
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-amber-400">[CHUỘT TRÁI]</strong> Khai hỏa
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-cyan-300">
              [NHẤN / ĐÈ GIỮ {dashKeyLabel}]
            </strong>{' '}
            Lướt / Tụ Lực ({ship.chargeSkillName})
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-rose-400">[{overdriveKeyLabel}]</strong> Tuyệt Kỹ Nộ 10s ({ship.overdriveEffectName})
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[#0D111A]/90 border border-slate-800/90 px-3 py-1.5 font-mono text-[10px] text-emerald-300 uppercase tracking-widest tabular-nums">
            TỔNG KHO: ✦ {hud.totalShards.toLocaleString('vi-VN')}
          </div>
          <div className="bg-[#0D111A]/90 border border-slate-800/90 px-3 py-1.5 font-mono text-[10px] text-slate-300 uppercase tracking-widest tabular-nums">
            HẠ ĐỊCH: {hud.enemiesDefeated}
          </div>
        </div>
      </div>
    </div>
  );
};
