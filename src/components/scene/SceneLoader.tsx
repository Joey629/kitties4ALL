import { Html, useProgress } from '@react-three/drei';

export function SceneLoader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        <p className="text-sm text-charcoal/50 font-medium">
          Entering the shelter…
        </p>
        <div className="w-24 h-0.5 bg-warm-brown/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage/60 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}
