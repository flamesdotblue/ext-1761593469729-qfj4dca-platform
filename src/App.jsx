import { useEffect, useMemo, useState } from 'react';
import HeroCover from './components/HeroCover';
import HUD from './components/HUD';
import TextAdventure from './components/TextAdventure';
import PlatformerRPG from './components/PlatformerRPG';

const NES_PALETTE = {
  bg: '#0f0f1b',
  text: '#c0f070',
  accent: '#5bc0eb',
  danger: '#ff4d6d',
  gold: '#ffd166',
  ui: '#2b2d42',
};

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' | 'platform'
  const [log, setLog] = useState([
    'You awaken to a blinking cursor in a silent void.',
    'Words whisper around you, ready to become real.',
    'Type HELP to learn the rules of this world.'
  ]);
  const [entities, setEntities] = useState([]); // {id,type,word,x,y,width,height,hp}
  const [player, setPlayer] = useState({ hp: 12, maxHp: 12, xp: 0, lvl: 1, atk: 3, def: 1 });
  const [inventory, setInventory] = useState(['INK']);
  const [seed, setSeed] = useState(1);

  // Inject 8-bit font (Press Start 2P)
  useEffect(() => {
    const id = 'press-start-2p-font';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      document.head.appendChild(link);
    }
    document.documentElement.style.setProperty('--nes-bg', NES_PALETTE.bg);
    document.documentElement.style.setProperty('--nes-text', NES_PALETTE.text);
  }, []);

  // Minimal game helpers
  const addLog = (line) => setLog((l) => [...l, line]);
  const clearTo = (lines) => setLog(lines);

  const onSpawnFromText = (newEntities, nextMode) => {
    // Merge dedup by id
    setEntities((prev) => {
      const map = new Map(prev.map((e) => [e.id, e]));
      newEntities.forEach((e) => map.set(e.id, e));
      return Array.from(map.values());
    });
    if (nextMode) setMode(nextMode);
    setSeed((s) => s + 1);
  };

  const onBattleResult = (result) => {
    if (result.type === 'enemyDefeated') {
      setPlayer((p) => {
        const newXp = p.xp + result.xp;
        const didLevel = newXp >= p.lvl * 10;
        return {
          ...p,
          xp: didLevel ? newXp - p.lvl * 10 : newXp,
          lvl: didLevel ? p.lvl + 1 : p.lvl,
          maxHp: didLevel ? p.maxHp + 2 : p.maxHp,
          hp: didLevel ? p.maxHp + 2 : p.hp,
          atk: didLevel ? p.atk + 1 : p.atk,
          def: didLevel ? p.def + 1 : p.def,
        };
      });
      addLog(`You overcame ${result.word}. +${result.xp} XP!`);
    }
    if (result.type === 'playerHit') {
      setPlayer((p) => ({ ...p, hp: Math.max(0, p.hp - result.damage) }));
      if (player.hp - result.damage <= 0) {
        addLog('You fade into the void. Type RESTART to try again.');
        setMode('text');
      }
    }
  };

  const onCollect = (item) => {
    setInventory((inv) => [...inv, item]);
    addLog(`Collected ${item}.`);
  };

  const resetGame = () => {
    setMode('text');
    setEntities([]);
    setPlayer({ hp: 12, maxHp: 12, xp: 0, lvl: 1, atk: 3, def: 1 });
    setInventory(['INK']);
    clearTo([
      'You awaken to a blinking cursor in a silent void.',
      'Words whisper around you, ready to become real.',
      'Type HELP to learn the rules of this world.'
    ]);
  };

  const theme = useMemo(() => ({ palette: NES_PALETTE, fontFamily: "'Press Start 2P', monospace" }), []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: NES_PALETTE.bg, color: NES_PALETTE.text, fontFamily: theme.fontFamily }}>
      <HeroCover url="https://prod.spline.design/OIGfFUmCnZ3VD8gH/scene.splinecode" />
      <div className="relative mx-auto w-full max-w-6xl px-4 -mt-20">
        <div className="rounded-lg border border-white/10 bg-black/40 backdrop-blur p-3">
          <HUD player={player} inventory={inventory} palette={NES_PALETTE} />
          <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-md border border-white/10 p-3 bg-[#171726]">
              <TextAdventure
                log={log}
                setLog={setLog}
                onSpawnFromText={onSpawnFromText}
                inventory={inventory}
                setInventory={setInventory}
                player={player}
                setPlayer={setPlayer}
                onRestart={resetGame}
                palette={NES_PALETTE}
              />
            </div>
            <div className="rounded-md border border-white/10 p-3 bg-[#171726]">
              <PlatformerRPG
                key={seed}
                mode={mode}
                setMode={setMode}
                entities={entities}
                setEntities={setEntities}
                palette={NES_PALETTE}
                player={player}
                setPlayer={setPlayer}
                onBattleResult={onBattleResult}
                onCollect={onCollect}
                fontFamily={theme.fontFamily}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-white/50 mt-3 text-center" style={{ fontFamily: theme.fontFamily }}>
          Tip: In text mode, try commands like LOOK, TAKE INK, USE INK, GO NORTH, SAY ABYSS, SUMMON GUARDIAN, FEAR.
        </p>
      </div>
    </div>
  );
}
