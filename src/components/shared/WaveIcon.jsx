export default function WaveIcon({ size = 32, animated = true }) {
  const bars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6];
  return (
    <div className="flex items-end gap-0.5" style={{ height: size, width: size * 1.4 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-full ${animated ? 'animate-wave' : ''}`}
          style={{
            height: `${h * 100}%`,
            background: 'linear-gradient(180deg, #7B2EFF, #39FF6A)',
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}