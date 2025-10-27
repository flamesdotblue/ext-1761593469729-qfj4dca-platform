export default function HUD({ player, inventory, palette }) {
  return (
    <div className="grid grid-cols-2 gap-2 items-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <Stat label="LV" value={player.lvl} color={palette.gold} />
        <Bar label="HP" value={player.hp} max={player.maxHp} color={palette.danger} />
        <Bar label="XP" value={player.xp} max={player.lvl * 10} color={palette.accent} />
        <Stat label="ATK" value={player.atk} />
        <Stat label="DEF" value={player.def} />
      </div>
      <div className="justify-self-end text-xs">
        <span className="opacity-70 mr-2">BAG</span>
        {inventory.slice(-5).map((it, i) => (
          <span key={i} className="inline-block px-2 py-1 mr-1 border border-white/20 bg-black/40 rounded-sm">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="opacity-70">{label}</span>
      <span style={{ color }}>{value}</span>
    </span>
  );
}

function Bar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="inline-flex items-center gap-2">
      <span className="opacity-70">{label}</span>
      <div className="w-28 h-3 border border-white/20 bg-black/60">
        <div className="h-full" style={{ width: pct + '%', background: color }} />
      </div>
    </div>
  );
}
