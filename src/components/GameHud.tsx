import React from 'react';
import { HudSnapshot, KeybindConfig } from '../game/types';
import { GAME_MODES, SHIPS, WEAPONS, formatKeyLabel } from '../game/catalog';

interface GameHudProps {
  hud: HudSnapshot;
  keybinds: KeybindConfig;
  muted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
  onOpenKeybinds: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  keybinds,
  muted,
  onPause,
  onToggleMute,
  onOpenKeybinds,
}) => {
  const dashPercent = Math.max(0, Math.min(100, hud.dashCharge * 100));
  const overdrivePercent = Math.max(0, Math.min(100, hud.overdriveCharge));
  const bossHpPercent = hud.boss ? Math.max(0, Math.min(100, (hud.boss.hp / hud.boss.maxHp) * 100)) : 0;

  const isLowShields = hud.shields <= 1;
  const weapon = WEAPONS[hud.weapon] ?? WEAPONS.pulse;
  const ship = SHIPS[hud.shipId] || SHIPS.vanguard;
  const modeInfo = GAME_MODES.find((m) => m.id === hud.mode);

  const dashKeyLabel = formatKeyLabel(keybinds.dash);
  const overdriveKeyLabel = formatKeyLabel(keybinds.overdrive);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Row: Ship Telemetry | Sector Theme & Boss & Boosts | Score & Controls */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Shields, Dash [Q] with Unique Ship Effect, Overdrive [E] */}
        <div
          className="bg-[#0D111A]/92 border border-slate-700/75 px-4 py-3.5 min-w-[270px] sm:min-w-[310px] shadow-lg"
          style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300 font-semibold">
              KHIÊN SINH MẠNG // {ship.name}
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                isLowShields ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {hud.shields} / {hud.maxShields}
            </span>
          </div>

          {/* Segmented Shields Bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: Math.max(1, hud.maxShields) }).map((_, idx) => {
              const active = idx < hud.shields;
              return (
                <div
                  key={idx}
                  className={`h-2.5 flex-1 border transition-all duration-150 ${
                    active
                      ? isLowShields
                        ? 'bg-rose-500 border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-emerald-400 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                />
              );
            })}
          </div>

          {/* Dash Thruster Bar [Q] with unique ship Dash effect label */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-mono text-[9px] uppercase tracking-[0.14em] font-bold"
                style={{ color: ship.dashColor }}
              >
                LƯỚT [{dashKeyLabel}] // {ship.dashEffectName}
              </span>
              <span className="font-mono text-[10px] text-cyan-300 tabular-nums font-bold">
                {dashPercent >= 100 ? 'SẴN SÀNG' : `${Math.floor(dashPercent)}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900/90 overflow-hidden border border-slate-800">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${dashPercent}%`,
                  backgroundColor: ship.dashColor,
                }}
              />
            </div>
          </div>

          {/* Overdrive Ultimate Gauge [E] */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-amber-300 font-semibold">
                OVERDRIVE [{overdriveKeyLabel}]
              </span>
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${
                  hud.overdriveActive
                    ? 'text-amber-300 animate-pulse'
                    : overdrivePercent >= 100
                    ? 'text-emerald-400 animate-bounce'
                    : 'text-slate-400'
                }`}
              >
                {hud.overdriveActive
                  ? 'ĐANG BÙNG NỔ!'
                  : overdrivePercent >= 100
                  ? `NHẤN [${overdriveKeyLabel}] KÍCH HOẠT`
                  : `${Math.floor(overdrivePercent)}%`}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900/90 border border-amber-500/40 p-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  hud.overdriveActive
                    ? 'bg-gradient-to-r from-amber-400 via-rose-400 to-cyan-300'
                    : overdrivePercent >= 100
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-200'
                    : 'bg-amber-500/70'
                }`}
                style={{ width: `${overdrivePercent}%` }}
              />
            </div>
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
                  {Math.ceil(hud.boss.hp).toLocaleString('vi-VN')} / {hud.boss.maxHp.toLocaleString('vi-VN')}
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
            className="bg-[#0D111A]/92 border border-slate-700/75 px-4 py-3 text-right min-w-[220px] shadow-lg"
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
                ✦ +{hud.runShards} MẢNH SAO
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
              title="Tùy chỉnh phím tắt"
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
            className="bg-[#0D111A]/90 border-y-2 px-10 py-3 shadow-2xl"
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

      {/* Bottom Row: Controls Help & Active Perks */}
      <div className="flex items-end justify-between gap-4">
        <div className="bg-[#0D111A]/88 border border-slate-800/90 px-3.5 py-2 font-mono text-[11px] text-slate-300 tracking-wider uppercase flex flex-wrap items-center gap-3">
          <span>
            <strong className="text-amber-400">
              [{formatKeyLabel(keybinds.up)}/{formatKeyLabel(keybinds.left)}/{formatKeyLabel(keybinds.down)}/{formatKeyLabel(keybinds.right)}]
            </strong>{' '}
            Di chuyển
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-amber-400">[CHUỘT TRÁI / {formatKeyLabel(keybinds.fire)}]</strong> Khai hỏa
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-cyan-300">[{dashKeyLabel} / CHUỘT PHẢI]</strong> Lướt ({ship.dashEffectName})
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-rose-400">[{overdriveKeyLabel}]</strong> Overdrive
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hud.activePerks.length > 0 && (
            <div className="bg-[#0D111A]/88 border border-slate-800/90 px-3 py-1.5 font-mono text-[10px] text-cyan-300 uppercase tracking-widest">
              LÕI ĐÃ LẮP: {hud.activePerks.length}
            </div>
          )}
          <div className="bg-[#0D111A]/88 border border-slate-800/90 px-3 py-1.5 font-mono text-[10px] text-slate-400 uppercase tracking-widest tabular-nums">
            HẠ ĐỊCH: {hud.enemiesDefeated}
          </div>
        </div>
      </div>
    </div>
  );
};
