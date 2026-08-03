const BARS = [
  { delay: '0s',     maxH: '32px' },
  { delay: '0.15s',  maxH: '52px' },
  { delay: '0.05s',  maxH: '44px' },
  { delay: '0.25s',  maxH: '60px' },
  { delay: '0.10s',  maxH: '40px' },
  { delay: '0.35s',  maxH: '56px' },
  { delay: '0.20s',  maxH: '36px' },
  { delay: '0.30s',  maxH: '48px' },
  { delay: '0.08s',  maxH: '52px' },
];

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#08041A] gap-8">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-neon-purple/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-neon-green/8 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div style={{ animation: 'logo-glow 2.4s ease-in-out infinite, fade-up 0.8s ease both' }}>
        <img
          src="/icons/icon-512.png"
          alt="Toca Mais"
          className="w-28 h-28 rounded-2xl"
        />
      </div>

      {/* Equalizer bars */}
      <div
        className="flex items-end gap-[6px]"
        style={{ height: '64px', animation: 'fade-up 0.8s ease 0.3s both' }}
      >
        {BARS.map((bar, i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: bar.maxH,
              borderRadius: '4px',
              background: 'linear-gradient(to top, #7B2EFF, #39FF6A)',
              transformOrigin: 'bottom',
              animation: `eq-bar ${0.8 + (i % 3) * 0.18}s ease-in-out ${bar.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Name + slogan */}
      <div
        className="text-center"
        style={{ animation: 'fade-up 0.8s ease 0.55s both' }}
      >
        <p className="text-white font-black text-xl tracking-widest uppercase">Toca Mais</p>
        <p className="text-gray-500 text-xs mt-1 tracking-wider">Conectando artistas com o mundo!</p>
      </div>
    </div>
  );
}
