import { motion } from 'framer-motion';

export function DustParticles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: 10 + (i * 6.5) % 80,
    y: 15 + (i * 4.3) % 50,
    size: 2 + (i % 3),
    delay: (i * 0.3) % 4,
    duration: 5 + (i % 4),
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-soft-orange/30 border border-soft-orange/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -25, -50],
            x: [0, (p.id % 2 === 0 ? 6 : -6)],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
