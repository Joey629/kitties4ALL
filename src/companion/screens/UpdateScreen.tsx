import { useRef, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Send, X } from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';
import { CatAvatar } from '../components/MobileShell';
import { Button } from '@/admin/components/ui/button';
import { cn } from '@/admin/lib/utils';
import type { Mood, Eating, Behavior } from '../types';

const moodOptions: { value: Mood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'normal', label: 'Normal', emoji: '😌' },
  { value: 'concerned', label: 'Concerned', emoji: '😟' },
];

const eatingOptions: { value: Eating; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'low', label: 'Low' },
];

const behaviorOptions: { value: Behavior; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'shy', label: 'Shy' },
  { value: 'active', label: 'Active' },
];

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  renderOption,
}: {
  label: string;
  options: { value: T; label: string; emoji?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  renderOption?: (o: { value: T; label: string; emoji?: string }) => ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 border',
              value === o.value
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:bg-accent'
            )}
          >
            {renderOption ? renderOption(o) : (o.emoji ? `${o.emoji} ${o.label}` : o.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UpdateScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cats, submitUpdate } = useCompanion();
  const cat = cats.find((c) => c.id === id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mood, setMood] = useState<Mood | null>(null);
  const [eating, setEating] = useState<Eating | null>(null);
  const [behavior, setBehavior] = useState<Behavior | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!cat) return <div className="p-8 text-center text-muted-foreground">Cat not found</div>;

  const canSubmit = mood && eating && behavior;

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitUpdate({ catId: cat.id, mood, eating, behavior, note, photo: photo ?? undefined });
    setSubmitted(true);
    setTimeout(() => navigate('/companion'), 1800);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
      >
        <p className="text-5xl mb-4">💚</p>
        <h2 className="text-xl font-semibold text-foreground">Update sent!</h2>
        <p className="text-muted-foreground mt-2">
          Adopters and donors can see this on {cat.name}&apos;s timeline.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <CatAvatar photo={cat.photo} name={cat.name} />
        <div>
          <h1 className="text-xl font-semibold text-foreground">How is {cat.name} today?</h1>
          <p className="text-sm text-muted-foreground">Shared with the shelter team and supporters</p>
        </div>
      </div>

      <OptionGroup label="Mood" options={moodOptions} value={mood} onChange={setMood}
        renderOption={(o) => <>{o.emoji} {o.label}</>} />
      <OptionGroup label="Eating" options={eatingOptions} value={eating} onChange={setEating} />
      <OptionGroup label="Behavior" options={behaviorOptions} value={behavior} onChange={setBehavior} />

      <div className="mb-5">
        <p className="text-sm font-semibold text-foreground mb-2">Notes</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Anything to share about ${cat.name}...`}
          rows={3}
          className="w-full rounded-lg border border-input bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {photo ? (
        <div className="relative mb-4 overflow-hidden rounded-xl border border-border">
          <img src={photo} alt={`Update photo of ${cat.name}`} className="aspect-[4/3] w-full object-cover" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-xl mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-5 h-5" />
          Add photo
        </Button>
      )}

      <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full h-12 rounded-xl text-base">
        <Send className="w-5 h-5" />
        Submit update
      </Button>
    </motion.div>
  );
}
