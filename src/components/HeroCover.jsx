import Spline from '@splinetool/react-spline';

export default function HeroCover({ url }) {
  return (
    <section className="relative w-full h-[40vh] overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene={url} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#0f0f1b] pointer-events-none"></div>
      <div className="relative z-10 h-full flex items-end p-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>
            Textforge: A 8-bit Wordbound Quest
          </h1>
          <p className="mt-2 text-xs text-white/70" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            Where verbs spring to life and nouns become the ground beneath your feet.
          </p>
        </div>
      </div>
    </section>
  );
}
