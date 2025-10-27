import { useEffect, useRef, useState } from 'react';

export default function PlatformerRPG({ mode, setMode, entities, setEntities, palette, player, setPlayer, onBattleResult, onCollect, fontFamily }) {
  const canvasRef = useRef(null);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef(null);
  const animRef = useRef(null);

  // Player physics
  const phys = useRef({ x: 40, y: 120, vx: 0, vy: 0, onGround: false, facing: 1 });
  const keys = useRef({});

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    let running = true;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const rect = c.getBoundingClientRect();
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const paletteLocal = {
      bg: palette.bg,
      text: palette.text,
      accent: palette.accent,
      ground: '#1b1f3b',
      platform: '#2a2f54',
      enemy: palette.danger,
      npc: '#6ee7b7',
      player: '#ffd166',
    };

    const gravity = 0.6;
    const friction = 0.85;
    const speed = 2.1;
    const jumpV = -8.2;

    const measureWord = (w, size = 14) => {
      ctx.font = `${size}px ${fontFamily}`;
      const width = ctx.measureText(w).width;
      return { width, height: size + 6 };
    };

    const update = () => {
      const p = phys.current;

      // Input
      if (keys.current['ArrowLeft'] || keys.current['a']) {
        p.vx -= 0.4; p.facing = -1;
      }
      if (keys.current['ArrowRight'] || keys.current['d']) {
        p.vx += 0.4; p.facing = 1;
      }
      if ((keys.current['ArrowUp'] || keys.current['w'] || keys.current[' ']) && p.onGround) {
        p.vy = jumpV; p.onGround = false;
      }

      // Physics
      p.vx *= friction;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;

      // Bounds
      const W = c.clientWidth;
      const H = c.clientHeight;
      if (p.x < 0) p.x = 0;
      if (p.x > W - 16) p.x = W - 16;
      if (p.y > H - 16) { p.y = H - 16; p.vy = 0; p.onGround = true; }

      // Collisions with platforms
      p.onGround = false;
      entities.filter(e => e.type === 'platform').forEach(plat => {
        const { width, height } = measureWord(plat.word);
        const x = plat.x; const y = plat.y;
        // Player rect
        const pr = { x: p.x, y: p.y, w: 14, h: 16 };
        const r = { x, y, w: width, h: 10 };
        const overlapX = pr.x < r.x + r.w && pr.x + pr.w > r.x;
        const overlapY = pr.y < r.y + r.h && pr.y + pr.h > r.y;
        if (overlapX && overlapY) {
          // Simple top collision
          if (p.vy > 0 && pr.y + pr.h - p.vy <= r.y) {
            p.y = r.y - pr.h; p.vy = 0; p.onGround = true;
          }
        }
      });

      // Combat: player touching enemy
      entities.filter(e => e.type === 'enemy').forEach(en => {
        const pr = { x: p.x, y: p.y, w: 14, h: 16 };
        const er = { x: en.x, y: en.y, w: 40, h: 16 };
        const hit = pr.x < er.x + er.w && pr.x + pr.w > er.x && pr.y < er.y + er.h && pr.y + pr.h > er.y;
        if (hit) {
          // Exchange
          if (!en._cool) {
            const dmgToEnemy = Math.max(1, player.atk - 1);
            const dmgToPlayer = Math.max(1, 3 - player.def);
            onBattleResult({ type: 'playerHit', damage: dmgToPlayer, word: en.word });
            en.hp -= dmgToEnemy;
            en._cool = 20;
            if (en.hp <= 0) {
              onBattleResult({ type: 'enemyDefeated', word: en.word, xp: 6 });
              // Remove enemy and drop POTION
              setEntities((prev) => prev.filter(x => x.id !== en.id).concat([{ id: 'itm-potion-' + Date.now(), type: 'item', item: 'POTION', x: en.x + 10, y: en.y - 8 }]))
            }
          }
        }
        if (en._cool) en._cool--;
        // Patrol
        en.x += Math.sin(Date.now() / 300 + en.y) * 0.2;
      });

      // Items
      entities.filter(e => e.type === 'item').forEach(it => {
        const pr = { x: p.x, y: p.y, w: 14, h: 16 };
        const ir = { x: it.x, y: it.y, w: 10, h: 10 };
        const hit = pr.x < ir.x + ir.w && pr.x + pr.w > ir.x && pr.y < ir.y + ir.h && pr.y + pr.h > ir.y;
        if (hit) {
          onCollect(it.item);
          setEntities((prev) => prev.filter(x => x.id !== it.id));
        }
      });

      draw();
      if (running) animRef.current = requestAnimationFrame(update);
    };

    const drawScanlines = (ctx, w, h) => {
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      ctx.clearRect(0, 0, w, h);
      // background
      ctx.fillStyle = '#0b0b15';
      ctx.fillRect(0, 0, w, h);

      // Title strip
      ctx.fillStyle = '#12122a';
      ctx.fillRect(0, 0, w, 18);
      ctx.fillStyle = palette.text;
      ctx.font = `10px ${fontFamily}`;
      ctx.fillText('PLATFORM FIELD', 6, 12);

      // Platforms as words
      entities.filter(e => e.type === 'platform').forEach(plat => {
        const size = 14;
        ctx.font = `${size}px ${fontFamily}`;
        ctx.fillStyle = '#2a2f54';
        const { width } = ctx.measureText(plat.word);
        ctx.fillRect(plat.x - 2, plat.y - 10, width + 4, 12);
        ctx.fillStyle = palette.accent;
        ctx.fillText(plat.word, plat.x, plat.y);
      });

      // Enemies
      entities.filter(e => e.type === 'enemy').forEach(en => {
        ctx.fillStyle = '#3b1020';
        ctx.fillRect(en.x - 4, en.y - 4, 48, 24);
        ctx.fillStyle = palette.danger;
        ctx.font = `12px ${fontFamily}`;
        ctx.fillText(en.word, en.x, en.y + 12);
        // HP pips
        for (let i = 0; i < en.hp; i++) {
          ctx.fillRect(en.x + i * 4, en.y - 8, 3, 3);
        }
      });

      // NPCs
      entities.filter(e => e.type === 'npc').forEach(npc => {
        ctx.fillStyle = '#102d22';
        ctx.fillRect(npc.x - 4, npc.y - 8, 60, 28);
        ctx.fillStyle = '#6ee7b7';
        ctx.font = `12px ${fontFamily}`;
        ctx.fillText(npc.word, npc.x, npc.y + 10);
      });

      // Items
      entities.filter(e => e.type === 'item').forEach(it => {
        ctx.fillStyle = '#20321a';
        ctx.fillRect(it.x - 2, it.y - 2, 14, 14);
        ctx.fillStyle = '#9be564';
        ctx.font = `10px ${fontFamily}`;
        ctx.fillText(it.item, it.x - 2, it.y + 8);
      });

      // Player
      const p = phys.current;
      ctx.fillStyle = '#3b2d12';
      ctx.fillRect(p.x - 2, p.y - 2, 18, 20);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(p.x, p.y, 14, 16);
      // Face arrow
      ctx.fillStyle = palette.accent;
      ctx.fillRect(p.x + (p.facing > 0 ? 12 : -4), p.y + 6, 4, 2);

      // Ground
      ctx.fillStyle = '#10142a';
      ctx.fillRect(0, h - 12, w, 12);

      drawScanlines(ctx, w, h);

      // Tips
      ctx.font = `9px ${fontFamily}`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Arrows/WASD move, Space jump. Touch FEAR to fight. Press Esc to return.', 8, h - 20);
    };

    const loop = () => {
      update();
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [entities, palette, player.atk, player.def, fontFamily, onBattleResult, onCollect, setEntities]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.type === 'keydown') {
        keys.current[e.key] = true;
        if (e.key === 'Escape') setMode('text');
        if (!audioReady) {
          initChiptune();
        }
      } else {
        keys.current[e.key] = false;
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [audioReady, setMode]);

  const initChiptune = async () => {
    if (audioRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const master = ctx.createGain(); master.gain.value = 0.05; master.connect(ctx.destination);

    // Simple 2-voice loop
    const tempo = 120; // bpm
    const step = 60 / tempo / 2; // 8th notes
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

    let t = ctx.currentTime + 0.05;
    for (let i = 0; i < 64; i++) {
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain(); g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g1.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.9);
      o1.type = 'square'; o1.frequency.value = scale[(i * 2) % scale.length];
      o1.connect(g1).connect(master);
      o1.start(t); o1.stop(t + step);

      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.9);
      o2.type = 'triangle'; o2.frequency.value = scale[(i * 3 + 2) % scale.length] / 2;
      o2.connect(g2).connect(master);
      o2.start(t); o2.stop(t + step);

      t += step;
    }

    audioRef.current = ctx;
    setAudioReady(true);
  };

  return (
    <div className="flex flex-col" style={{ fontFamily }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] opacity-70">Mode: {mode === 'platform' ? 'Platforming' : 'Idle'} </span>
        <div className="flex items-center gap-2">
          <button className="text-[10px] px-2 py-1 border border-white/20 bg-black/40" onClick={() => setMode('text')}>Return</button>
          <button className="text-[10px] px-2 py-1 border border-white/20 bg-black/40" onClick={initChiptune}>{audioReady ? 'Chiptune On' : 'Start Chiptune'}</button>
        </div>
      </div>
      <div className="w-full h-[420px] border border-white/15 bg-[#0b0b15]">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
