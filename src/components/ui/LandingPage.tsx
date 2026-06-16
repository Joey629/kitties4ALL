import { motion } from 'framer-motion';
import { ClipboardCheck, Heart, PawPrint, Play } from 'lucide-react';
import { Button } from './Button';

interface LandingPageProps {
  onEnterShelter: () => void;
  onOpenAdoption: () => void;
  onOpenSupport: () => void;
  onTrackApplication: () => void;
}

function VideoPlaceholder() {
  return (
    <div
      className="experience-video-placeholder relative flex aspect-[4/3] w-full min-h-[240px] max-w-[22rem] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-warm-brown/10 sm:min-h-[280px] sm:max-w-[26rem] lg:min-h-[min(420px,52vh)] lg:max-w-none lg:w-full xl:max-w-[34rem]"
      role="img"
      aria-label="Video placeholder"
    >
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-sage-dark shadow-[0_8px_24px_-8px_rgba(92,122,101,0.35)] ring-4 ring-white/55 sm:h-[4.5rem] sm:w-[4.5rem]">
        <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
      </div>
      <p className="relative z-10 mt-5 text-base font-semibold text-warm-brown/65">Shelter tour video</p>
      <p className="relative z-10 mt-1 text-sm text-charcoal/45">Coming soon</p>
    </div>
  );
}

function ShelterLogo() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage text-white shadow-sm">
        <PawPrint className="h-5 w-5" />
      </div>
      <p className="text-xl font-semibold leading-tight text-warm-brown">Kitties 4 All</p>
    </div>
  );
}

export function LandingPage({
  onEnterShelter,
  onOpenAdoption,
  onOpenSupport,
  onTrackApplication,
}: LandingPageProps) {
  return (
    <div className="experience-theme experience-landing relative min-h-dvh overflow-hidden">
      <div
        className="experience-landing-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/shelter/landing-bg.png)' }}
        aria-hidden
      />
      <div className="experience-landing-overlay pointer-events-none absolute inset-0" aria-hidden />

      <header className="relative z-20 flex items-center justify-between gap-4 px-6 py-5 md:px-10 lg:px-14">
        <ShelterLogo />
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onTrackApplication}
            className="inline-flex items-center gap-1.5 rounded-full border border-warm-brown/12 bg-white/82 px-3.5 py-2 text-sm font-semibold text-sage-dark shadow-[0_4px_16px_-10px_rgba(139,111,71,0.35)] transition-colors hover:bg-white hover:text-sage sm:px-4"
          >
            <ClipboardCheck className="h-4 w-4 shrink-0" />
            <span className="hidden min-[420px]:inline">Track your adoption</span>
            <span className="min-[420px]:hidden">Track</span>
          </button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="rounded-full px-5 shadow-md"
            onClick={onOpenSupport}
          >
            <Heart className="h-4 w-4 fill-current" />
            Donate
          </Button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] items-center justify-center px-6 pb-8 md:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="flex flex-1 flex-col lg:max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-warm-brown md:text-5xl lg:text-[3.25rem]">
              Every Cat
              <br />
              <span className="text-sage-dark">Deserves a Home</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/75 md:text-lg">
              Kitties 4 All is a foster-based cat rescue. We save lives, provide loving care,
              and help cats find their forever homes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 lg:mt-10"
          >
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="primary" size="lg" className="rounded-full px-8" onClick={onEnterShelter}>
                Enter living shelter
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="rounded-full border-sage/35 bg-white/90 px-8 text-sage-dark hover:bg-sage/10"
                onClick={onOpenAdoption}
              >
                Adopt a cat
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 justify-center lg:justify-end lg:pr-2 xl:pr-6"
        >
          <VideoPlaceholder />
        </motion.div>
        </div>
      </div>
    </div>
  );
}
