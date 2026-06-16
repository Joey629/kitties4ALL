# Kitties 4 All — Digital Twin Cat Shelter

An immersive, portfolio-ready prototype that transforms shelter cat data into a warm 3D storytelling experience.

## Concept

Instead of browsing a traditional list, visitors virtually enter a cozy cat shelter where every cat has a presence — sleeping, playing, stretching, or wandering through the space. Click any cat to read their story and start an adoption or support journey.

**"Every cat has a story."**

## Tech Stack

- **React 19** + **TypeScript**
- **React Three Fiber** + **Three.js** — 3D shelter scene
- **@react-three/drei** — helpers (OrbitControls, ContactShadows, Text)
- **Tailwind CSS v4** — UI styling
- **Framer Motion** — page transitions and panel animations
- **Vite** — build tooling

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174) — website (`/`), admin (`/admin`), and companion (`/companion`) all share this origin.

```bash
npm run build    # production build
npm run preview  # preview production build
```

## Experience Flow

1. **Landing Page** — Warm welcome with "Enter the Shelter" CTA
2. **Virtual Shelter** — Explore a 3D room with beds, scratching posts, plants, toys, and food bowls
3. **Interactive Cats** — Click any cat to open their profile panel
4. **Day Cycle** — Morning / Afternoon / Evening / Night shifts cat behaviors
5. **Adoption & Support** — Modal flows for applications and donations

## Architecture

```
src/
├── types/cat.ts          # Cat, AnimationState, TimeOfDay types
├── data/cats.ts          # Mock JSON-ready cat data
├── hooks/
│   ├── useTimeOfDay.ts   # Day/night cycle + lighting config
│   └── useCatBehavior.ts # Time-driven animation states
├── context/
│   └── ShelterContext.tsx # Global shelter UI state
├── components/
│   ├── scene/            # R3F 3D components
│   │   ├── ShelterScene.tsx
│   │   ├── Cat3D.tsx
│   │   ├── CatEntity.tsx
│   │   ├── Furniture.tsx
│   │   └── SceneLighting.tsx
│   └── ui/               # 2D overlay components
│       ├── LandingPage.tsx
│       ├── CatProfilePanel.tsx
│       ├── AdoptionModal.tsx
│       └── ...
└── App.tsx
```

## Data Model

```typescript
interface Cat {
  id: string;
  name: string;
  age: string;
  personality: string[];
  status: 'available' | 'pending' | 'adopted' | 'medical_hold';
  position: { x: number; y: number; z: number; rotation?: number };
  animationState: 'sleeping' | 'walking' | 'stretching' | 'playing' | 'idle';
  story: string;
  image: string;
  color: string;
  accentColor: string;
  breed: string;
}
```

Designed for future integration with a shelter management SaaS backend — swap `src/data/cats.ts` for an API fetch.

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#fdf6ec` | Backgrounds |
| Sage | `#85a98f` | Primary actions |
| Coral | `#e27d60` | Donation CTAs |
| Warm Brown | `#8b6f47` | Headings |
| Lavender | `#c3b1e1` | Accents |

Fonts: **Fredoka** (display), **Nunito** (body)

## License

Prototype for UX/product portfolio use. Kitties 4 All is a fictional non-profit.
