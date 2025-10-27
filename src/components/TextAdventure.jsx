import { useMemo, useRef, useState } from 'react';

const KEYWORDS = {
  ABYSS: { type: 'platform', widthPerChar: 18 },
  BRIDGE: { type: 'platform', widthPerChar: 16 },
  GUARDIAN: { type: 'npc', role: 'knight' },
  FEAR: { type: 'enemy', hp: 6 },
  WORD: { type: 'platform', widthPerChar: 14 },
};

export default function TextAdventure({ log, setLog, onSpawnFromText, inventory, setInventory, player, setPlayer, onRestart, palette }) {
  const [input, setInput] = useState('');
  const viewportRef = useRef(null);

  const prompt = useMemo(() => '> ', []);

  const push = (s) => setLog((prev) => [...prev, s]);

  const help = () => {
    push('Commands: LOOK, GO <DIR>, TAKE <THING>, USE <ITEM>, SAY <WORD>, SUMMON <WORD>, INVENTORY, RESTART');
    push('Tip: Some words become real. Try SAY ABYSS, SUMMON GUARDIAN, or FEAR.');
  };

  const look = () => {
    push('The void murmurs: ABYSS, BRIDGE, GUARDIAN, FEAR. The ground awaits your verbs.');
  };

  const spawnFromWord = (word) => {
    const W = word.toUpperCase();
    const spec = KEYWORDS[W];
    if (!spec) {
      push(`Nothing stirs at the word ${word}.`);
      return;
    }
    const created = [];
    if (spec.type === 'platform') {
      const width = W.length * (spec.widthPerChar || 16);
      created.push({ id: `plat-${W}-${Date.now()}`, type: 'platform', word: W, x: 60, y: 240, width, height: 20 });
      push(`${W} forms underfoot.`);
      onSpawnFromText(created, 'platform');
    } else if (spec.type === 'npc') {
      created.push({ id: `npc-${W}-${Date.now()}`, type: 'npc', word: W, role: spec.role, x: 260, y: 200, width: 64, height: 32, hp: 8 });
      push(`${W} takes shape: a steadfast ${spec.role}.`);
      onSpawnFromText(created, 'platform');
    } else if (spec.type === 'enemy') {
      created.push({ id: `enm-${W}-${Date.now()}`, type: 'enemy', word: W, x: 360, y: 200, width: 56, height: 24, hp: spec.hp || 5 });
      push(`${W} manifests as a gnawing presence.`);
      onSpawnFromText(created, 'platform');
    }
  };

  const handleCommand = (raw) => {
    const s = raw.trim();
    if (!s) return;
    push(prompt + s);
    const t = s.toUpperCase();

    if (t === 'HELP') return help();
    if (t === 'LOOK') return look();
    if (t.startsWith('SAY ')) return spawnFromWord(s.slice(4));
    if (t.startsWith('SUMMON ')) return spawnFromWord(s.slice(7));
    if (t.startsWith('TAKE ')) {
      const item = s.slice(5).trim().toUpperCase();
      if (item) {
        setInventory((inv) => [...inv, item]);
        push(`You take ${item}.`);
      }
      return;
    }
    if (t.startsWith('USE ')) {
      const item = s.slice(4).trim().toUpperCase();
      if (!item) return;
      if (!inventory.map((i) => i.toUpperCase()).includes(item)) {
        push(`You don't have ${item}.`);
        return;
      }
      if (item === 'INK') {
        push('You spill INK. Letters drip into a BRIDGE.');
        onSpawnFromText([{ id: `plat-INK-${Date.now()}`, type: 'platform', word: 'BRIDGE', x: 120, y: 200, width: 6 * 16, height: 20 }], 'platform');
      } else if (item === 'POTION') {
        setPlayer((p) => ({ ...p, hp: Math.min(p.maxHp, p.hp + 5) }));
        push('You feel braver. (+5 HP)');
      } else {
        push(`You use ${item}. Something subtle shifts.`);
      }
      return;
    }
    if (t === 'INVENTORY') {
      push('Bag: ' + (inventory.join(', ') || 'Empty'));
      return;
    }
    if (t.startsWith('GO ')) {
      const dir = t.split(' ')[1];
      push(`You move ${dir}. The scene rearranges.`);
      onSpawnFromText([
        { id: `plat-GO-${Date.now()}`, type: 'platform', word: 'WORD', x: 80, y: 220, width: 4 * 14, height: 20 },
      ], 'platform');
      return;
    }
    if (t === 'RESTART') return onRestart();

    // Hidden triggers
    if (t === 'FEAR') return spawnFromWord('FEAR');

    push("The void doesn't understand.");
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
      setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  return (
    <div className="flex flex-col h-[420px]">
      <div ref={viewportRef} className="flex-1 overflow-y-auto pr-2" style={{ fontFamily: "'Press Start 2P', monospace", lineHeight: '1.4' }}>
        {log.map((line, i) => (
          <p key={i} className="text-[12px] mb-2">{line}</p>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[12px] opacity-70" style={{ color: palette.accent }}>&gt;</span>
        <input
          className="flex-1 bg-black/50 border border-white/15 rounded-sm px-2 py-2 text-[12px] outline-none focus:border-white/40"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command (HELP)"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        />
      </div>
    </div>
  );
}
