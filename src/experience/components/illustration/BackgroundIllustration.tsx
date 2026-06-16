import { motion } from 'framer-motion';
import { ILLUSTRATION, LINE_CAP, LINE_JOIN } from './illustrationTokens';

type BackgroundVariant = 'adoption' | 'donation' | 'shelter' | 'hero';

interface BackgroundIllustrationProps {
  variant: BackgroundVariant;
  className?: string;
}

const floatAnim = {
  animate: { y: [0, -5, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
};

const swayAnim = {
  animate: { rotate: [-2, 2, -2] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
};

const driftAnim = {
  animate: { x: [0, 4, 0], y: [0, -3, 0] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
};

const pulseAnim = {
  animate: { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] },
  transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};

export function BackgroundIllustration({ variant, className = '' }: BackgroundIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 240"
      className={`w-full h-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {variant === 'adoption' && <AdoptionScene />}
      {variant === 'donation' && <DonationScene />}
      {variant === 'shelter' && <ShelterStoryScene />}
      {variant === 'hero' && <HeroAccentScene />}
    </svg>
  );
}

function AdoptionScene() {
  const s = ILLUSTRATION.stroke;
  const sw = ILLUSTRATION.strokeWidthThin;
  return (
    <g opacity="0.55">
      <rect x="0" y="0" width="400" height="240" fill={ILLUSTRATION.cream} />
      <ellipse cx="200" cy="200" rx="180" ry="50" fill={ILLUSTRATION.sageLight} opacity="0.4" />
      <g transform="translate(220, 80)">
        <circle cx="30" cy="20" r="14" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <rect x="18" y="36" width="24" height="40" rx="8" fill={ILLUSTRATION.softOrange} stroke={s} strokeWidth={sw} />
        <circle cx="70" cy="28" r="12" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <rect x="60" y="42" width="20" height="34" rx="6" fill={ILLUSTRATION.coral} stroke={s} strokeWidth={sw} opacity="0.7" />
        <circle cx="10" cy="50" r="8" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <rect x="4" y="60" width="12" height="18" rx="4" fill={ILLUSTRATION.sky} stroke={s} strokeWidth={sw} opacity="0.6" />
      </g>
      <motion.g transform="translate(80, 110)" {...floatAnim}>
        <ellipse cx="40" cy="50" rx="28" ry="22" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} />
        <circle cx="55" cy="28" r="18" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} />
        <polygon points="42,14 36,2 48,8" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} strokeLinejoin={LINE_JOIN} />
        <polygon points="68,14 74,2 62,8" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} strokeLinejoin={LINE_JOIN} />
        <circle cx="50" cy="28" r="3" fill="white" stroke={s} strokeWidth={1} />
        <circle cx="62" cy="28" r="3" fill="white" stroke={s} strokeWidth={1} />
        <circle cx="50" cy="28" r="1.5" fill={s} />
        <circle cx="62" cy="28" r="1.5" fill={s} />
        <path d="M20 55 Q8 45 14 32" stroke={s} strokeWidth={sw} fill="none" strokeLinecap={LINE_CAP} />
      </motion.g>
      <motion.path
        transform="translate(180, 130)"
        d="M0 4 C0 -2 8 -2 8 4 C8 -2 16 -2 16 4 C16 10 8 16 8 16 C8 16 0 10 0 4"
        fill={ILLUSTRATION.coral}
        stroke={s}
        strokeWidth={1}
        {...pulseAnim}
      />
    </g>
  );
}

function DonationScene() {
  const s = ILLUSTRATION.stroke;
  const sw = ILLUSTRATION.strokeWidthThin;
  return (
    <g opacity="0.55">
      <rect x="0" y="0" width="400" height="240" fill={ILLUSTRATION.creamDark} />
      <ellipse cx="200" cy="210" rx="160" ry="40" fill={ILLUSTRATION.beige} opacity="0.5" />
      <g transform="translate(60, 60)">
        <circle cx="40" cy="24" r="16" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <rect x="24" y="42" width="32" height="50" rx="10" fill={ILLUSTRATION.sage} stroke={s} strokeWidth={sw} />
        <rect x="80" y="70" width="50" height="40" rx="6" fill={ILLUSTRATION.white} stroke={s} strokeWidth={sw} />
        <text x="105" y="95" textAnchor="middle" fill={ILLUSTRATION.coral} fontSize="14" fontFamily="Fredoka, sans-serif">♥</text>
      </g>
      <g transform="translate(220, 100)">
        <ellipse cx="30" cy="40" rx="22" ry="16" fill={ILLUSTRATION.softOrange} stroke={s} strokeWidth={sw} />
        <circle cx="42" cy="22" r="14" fill={ILLUSTRATION.softOrange} stroke={s} strokeWidth={sw} />
        <ellipse cx="90" cy="50" rx="18" ry="14" fill={ILLUSTRATION.cream} stroke={s} strokeWidth={sw} />
        <circle cx="98" cy="36" r="12" fill={ILLUSTRATION.cream} stroke={s} strokeWidth={sw} />
        <ellipse cx="55" cy="72" rx="16" ry="5" fill={ILLUSTRATION.sky} stroke={s} strokeWidth={sw} />
        <ellipse cx="55" cy="70" rx="10" ry="3" fill={ILLUSTRATION.coral} />
      </g>
      <motion.g transform="translate(300, 40)" {...driftAnim}>
        <circle cx="20" cy="20" r="18" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} opacity="0.6" />
        <text x="20" y="26" textAnchor="middle" fill={ILLUSTRATION.coral} fontSize="16">🐾</text>
      </motion.g>
    </g>
  );
}

function ShelterStoryScene() {
  const s = ILLUSTRATION.stroke;
  const sw = ILLUSTRATION.strokeWidthThin;
  return (
    <g opacity="0.55">
      <rect x="0" y="0" width="400" height="240" fill={ILLUSTRATION.cream} />
      <g transform="translate(40, 50)">
        <circle cx="50" cy="30" r="18" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <ellipse cx="50" cy="18" rx="20" ry="12" fill={ILLUSTRATION.warmBrown} stroke={s} strokeWidth={sw} opacity="0.8" />
        <rect x="32" y="50" width="36" height="55" rx="12" fill={ILLUSTRATION.sage} stroke={s} strokeWidth={sw} />
        <ellipse cx="90" cy="90" rx="8" ry="12" fill={ILLUSTRATION.peach} stroke={s} strokeWidth={sw} />
        <ellipse cx="110" cy="95" rx="24" ry="16" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} />
        <circle cx="125" cy="78" r="14" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} />
      </g>
      <g transform="translate(240, 60)">
        <rect x="0" y="40" width="120" height="80" rx="8" fill={ILLUSTRATION.beige} stroke={s} strokeWidth={sw} />
        <rect x="10" y="10" width="50" height="40" rx="4" fill={ILLUSTRATION.white} stroke={s} strokeWidth={sw} />
        <line x1="35" y1="10" x2="35" y2="50" stroke={s} strokeWidth={sw} />
        <line x1="10" y1="30" x2="60" y2="30" stroke={s} strokeWidth={sw} />
        <ellipse cx="90" cy="120" rx="30" ry="10" fill={ILLUSTRATION.sageLight} stroke={s} strokeWidth={sw} />
      </g>
      <motion.g transform="translate(320, 140)" style={{ transformOrigin: '15px 40px' }} {...swayAnim}>
        <rect x="8" y="20" width="14" height="18" rx="3" fill={ILLUSTRATION.beigeDark} stroke={s} strokeWidth={sw} />
        <circle cx="15" cy="12" r="14" fill={ILLUSTRATION.sage} stroke={s} strokeWidth={sw} />
        <circle cx="22" cy="6" r="9" fill={ILLUSTRATION.sageDark} stroke={s} strokeWidth={sw} opacity="0.7" />
      </motion.g>
    </g>
  );
}

function HeroAccentScene() {
  const s = ILLUSTRATION.stroke;
  const sw = ILLUSTRATION.strokeWidthThin;
  return (
    <g opacity="0.35">
      <circle cx="60" cy="60" r="40" fill={ILLUSTRATION.softOrange} opacity="0.3" />
      <circle cx="340" cy="180" r="50" fill={ILLUSTRATION.sageLight} opacity="0.4" />
      <motion.g {...driftAnim}>
        <path transform="translate(300, 30)" d="M0 20 Q15 0 30 20 Q15 35 0 20" fill={ILLUSTRATION.coral} stroke={s} strokeWidth={1} opacity="0.5" />
      </motion.g>
      <motion.g transform="translate(30, 150)" {...floatAnim}>
        <circle cx="12" cy="12" r="10" fill={ILLUSTRATION.lavender} stroke={s} strokeWidth={sw} opacity="0.6" />
        <text x="12" y="16" textAnchor="middle" fontSize="10">🐾</text>
      </motion.g>
    </g>
  );
}
