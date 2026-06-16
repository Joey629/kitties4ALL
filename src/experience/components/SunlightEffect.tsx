import { motion } from 'framer-motion';

export function SunlightEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute top-[6%] left-[5%] w-[38%] h-[48%]"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,220,150,0.18) 0%, rgba(255,200,120,0.08) 50%, transparent 70%)',
          clipPath: 'polygon(0 0, 100% 15%, 85% 100%, 0 85%)',
        }}
        animate={{ opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute bg-soft-orange/15 rounded-full"
          style={{
            top: `${10 + i * 5}%`,
            left: `${6 + i * 3}%`,
            width: 3,
            height: `${20 + i * 10}%`,
            transform: `rotate(${12 + i * 6}deg)`,
            transformOrigin: 'top center',
          }}
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 5 + i, repeat: Infinity, delay: i * 1.2 }}
        />
      ))}
    </div>
  );
}
