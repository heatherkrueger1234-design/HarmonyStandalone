// @ts-nocheck
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCSRFToken } from '@/lib/queryClient';
import {
  Sparkles, Loader2, Download, RefreshCw, Check,
  Wand2, Camera, Clock, ChevronLeft, ChevronRight,
  Upload, X, User, Users,
} from 'lucide-react';

// ── Shared constants ───────────────────────────────────────────────────────────
const STYLES = [
  { value: 'photorealistic', label: '📸 Photo' },
  { value: 'cinematic',      label: '🎬 Cinematic' },
  { value: 'painting',       label: '🖼️ Painting' },
  { value: 'watercolor',     label: '🎨 Watercolor' },
];

const SETTINGS = [
  'romantic outdoor sunset', 'cozy coffee shop', 'Paris streets at dusk',
  'beach at golden hour', 'snowy mountain cabin', 'rooftop city lights',
  'lavender fields', 'dancing under string lights',
];

const PROMPTS = [
  'A couple in their late 30s, warm smiles, arms around each other',
  'Two people deeply in love, laughing together, natural and candid',
  'Partners at peace together, forehead-to-forehead, eyes closed',
  'A couple dancing spontaneously in the rain',
];

const TIME_OPTIONS = [
  { dir: 'forward', years: 10, label: '+10 years', emoji: '🌿', desc: 'A decade of love' },
  { dir: 'forward', years: 20, label: '+20 years', emoji: '🌳', desc: 'Twenty years together' },
  { dir: 'forward', years: 30, label: '+30 years', emoji: '🌲', desc: 'Thirty years strong' },
  { dir: 'rewind',  years: 10, label: '−10 years', emoji: '⏪', desc: 'Ten years younger' },
  { dir: 'rewind',  years: 20, label: '−20 years', emoji: '⏮️', desc: 'Young & in love' },
];

// ── Shared result panel ────────────────────────────────────────────────────────
function ResultPanel({ imageUrl, label, onReset, onAddToBoard }: {
  imageUrl: string; label?: string; onReset: () => void; onAddToBoard?: (url: string, prompt: string) => void;
}) {
  const [pinned, setPinned] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { toast } = useToast();

  const download = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'our-future-together.png';
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
    toast({ title: '📱 Saved to Downloads!' });
  };

  const pin = () => {
    if (!onAddToBoard) return;
    onAddToBoard(imageUrl, label || 'Our future together');
    setPinned(true);
    setTimeout(() => setPinned(false), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl">
        <img src={imageUrl} alt="AI generated" className="w-full rounded-2xl" />
        {label && (
          <div className="absolute top-3 left-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-sm">{label}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl pointer-events-none" />
      </div>

      <div className="space-y-2">
        {onAddToBoard && (
          <Button onClick={pin} disabled={pinned} className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl">
            {pinned ? <><Check className="w-4 h-4 mr-2" />Pinned!</> : <><Sparkles className="w-4 h-4 mr-2" />Pin to Vision Board</>}
          </Button>
        )}
        <Button onClick={download} variant="ghost"
          className={`w-full h-11 font-bold rounded-xl border transition-all ${downloaded ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/[0.05] border-white/[0.1] text-white/75 hover:text-white'}`}>
          {downloaded ? <><Check className="w-4 h-4 mr-2" />Saved!</> : <><Download className="w-4 h-4 mr-2" />Save to Device</>}
        </Button>
      </div>

      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 text-white/35 hover:text-white/60 text-sm py-1 transition-colors">
        <RefreshCw className="w-3.5 h-3.5" /> Generate another
      </button>
    </motion.div>
  );
}

// ── Photo upload slot ──────────────────────────────────────────────────────────
function PhotoSlot({ label, file, onFile, onClear }: {
  label: string; file: File | null;
  onFile: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/30 mb-1.5">{label}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden aspect-square border border-white/10">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button onClick={onClear}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full aspect-square rounded-xl border-2 border-dashed border-white/15 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 flex flex-col items-center justify-center gap-2 transition-all">
          <Upload className="w-5 h-5 text-white/25" />
          <span className="text-[10px] text-white/25">Upload photo</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}

// ── Tab 1: Describe ─────────────────────────────────────────────────────────────
function DescribeTab({ onAddToBoard }: { onAddToBoard?: (url: string, prompt: string) => void }) {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [setting, setSetting] = useState('romantic outdoor sunset');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string } | null>(null);

  const generate = async () => {
    if (!description.trim()) { toast({ variant: 'destructive', title: 'Describe the couple first' }); return; }
    setLoading(true); setResult(null);
    try {
      const csrf = await getCSRFToken();
      const res = await fetch('/api/image-gen/couple-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
        credentials: 'include',
        body: JSON.stringify({ description, style, setting }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed');
      setResult({ imageUrl: data.imageUrl });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally { setLoading(false); }
  };

  if (result) {
    return <ResultPanel imageUrl={result.imageUrl} onReset={() => setResult(null)} onAddToBoard={onAddToBoard} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Quick prompts</p>
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map(p => (
            <button key={p} onClick={() => setDescription(p)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${description === p ? 'bg-violet-500/25 border-violet-500/50 text-violet-300' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/70'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/40 text-xs mb-1.5 uppercase tracking-wider">Describe the couple</p>
        <Textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="e.g. A woman with dark curly hair and a tall man with a warm smile, mid-30s, dressed casually..."
          rows={3} className="bg-white/[0.04] border-white/[0.1] text-white placeholder:text-white/25 text-sm resize-none focus:ring-1 focus:ring-violet-500/50" />
        <div className="mt-2 flex gap-1.5 items-start bg-amber-500/[0.08] border border-amber-500/20 rounded-lg px-3 py-2">
          <span className="text-amber-400 text-xs flex-shrink-0">💡</span>
          <p className="text-amber-300/70 text-[11px] leading-relaxed">Use <em>"alluring," "stunning," "glamorous"</em> instead of "sexy" to avoid content filters.</p>
        </div>
      </div>

      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Style</p>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => setStyle(s.value)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${style === s.value ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Setting</p>
        <div className="flex flex-wrap gap-1.5">
          {SETTINGS.map(s => (
            <button key={s} onClick={() => setSetting(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${setting === s ? 'bg-violet-500/25 border-violet-500/50 text-violet-300' : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:border-white/20 hover:text-white/70'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generate} disabled={loading || !description.trim()}
        className="w-full h-12 font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl shadow-lg">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating… (15–30s)</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Our Future Together</>}
      </Button>
    </div>
  );
}

// ── Tab 2: Time Travel ─────────────────────────────────────────────────────────
function TimeTravelTab({ onAddToBoard }: { onAddToBoard?: (url: string, prompt: string) => void }) {
  const { toast } = useToast();
  const [photo1, setPhoto1] = useState<File | null>(null);
  const [photo2, setPhoto2] = useState<File | null>(null);
  const [selected, setSelected] = useState<typeof TIME_OPTIONS[0]>(TIME_OPTIONS[1]);
  const [style, setStyle] = useState('photorealistic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; label: string } | null>(null);

  const generate = async () => {
    if (!photo1) { toast({ variant: 'destructive', title: 'Upload at least one photo' }); return; }
    setLoading(true); setResult(null);
    try {
      const csrf = await getCSRFToken();
      const fd = new FormData();
      fd.append('photo1', photo1);
      if (photo2) fd.append('photo2', photo2);
      fd.append('direction', selected.dir);
      fd.append('years', String(selected.years));
      fd.append('style', style);

      const res = await fetch('/api/image-gen/time-travel', {
        method: 'POST',
        headers: csrf ? { 'X-CSRF-Token': csrf } : {},
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed');
      setResult({ imageUrl: data.imageUrl, label: data.label });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: err.message });
    } finally { setLoading(false); }
  };

  if (result) {
    return <ResultPanel imageUrl={result.imageUrl} label={result.label} onReset={() => setResult(null)} onAddToBoard={onAddToBoard} />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/[0.07] p-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
        <p className="text-[10px] text-white/30 leading-relaxed">
          Upload a photo of yourself, your partner, or both. The AI will show you how you'd look at different ages — aging forward or rewinding years. Great for envisioning your journey together.
        </p>
      </div>

      {/* Photo upload slots */}
      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Your photos</p>
        <div className="flex gap-3">
          <PhotoSlot label="Person 1" file={photo1} onFile={setPhoto1} onClear={() => setPhoto1(null)} />
          <PhotoSlot label="Person 2 (optional)" file={photo2} onFile={setPhoto2} onClear={() => setPhoto2(null)} />
        </div>
      </div>

      {/* Time direction */}
      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Time direction</p>
        <div className="grid grid-cols-1 gap-1.5">
          {/* Forward */}
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mt-1">Age forward ↗</p>
          <div className="grid grid-cols-3 gap-1.5">
            {TIME_OPTIONS.filter(t => t.dir === 'forward').map(opt => (
              <button key={opt.label} onClick={() => setSelected(opt)}
                className={`p-2.5 rounded-xl border text-center transition-all ${selected === opt ? 'bg-violet-500/20 border-violet-500/40' : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'}`}>
                <span className="text-lg leading-none block mb-1">{opt.emoji}</span>
                <p className={`text-xs font-bold ${selected === opt ? 'text-violet-300' : 'text-white/60'}`}>{opt.label}</p>
                <p className="text-[9px] text-white/25 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          {/* Rewind */}
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/20 mt-2">Rewind years ↩</p>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_OPTIONS.filter(t => t.dir === 'rewind').map(opt => (
              <button key={opt.label} onClick={() => setSelected(opt)}
                className={`p-2.5 rounded-xl border text-center transition-all ${selected === opt ? 'bg-fuchsia-500/20 border-fuchsia-500/40' : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'}`}>
                <span className="text-lg leading-none block mb-1">{opt.emoji}</span>
                <p className={`text-xs font-bold ${selected === opt ? 'text-fuchsia-300' : 'text-white/60'}`}>{opt.label}</p>
                <p className="text-[9px] text-white/25 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Style */}
      <div>
        <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">Style</p>
        <div className="grid grid-cols-4 gap-1.5">
          {STYLES.map(s => (
            <button key={s.value} onClick={() => setStyle(s.value)}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${style === s.value ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/[0.07] text-white/50 hover:bg-white/[0.06]'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generate} disabled={loading || !photo1}
        className="w-full h-12 font-bold text-white rounded-xl shadow-lg"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#c026d3)' }}>
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating… (~20–40s)</>
          : <><Clock className="w-4 h-4 mr-2" />Travel {selected.dir === 'forward' ? 'Forward' : 'Back'} {selected.label}</>}
      </Button>
      <p className="text-white/20 text-[10px] text-center">Powered by GPT-4o vision · ~20–40 seconds</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'describe',  label: 'Create Vision', icon: Wand2 },
  { id: 'timetravel', label: 'Time Travel',  icon: Clock },
];

interface Props {
  onAddToBoard?: (imageUrl: string, prompt: string) => void;
}

export default function CouplePhotoGenerator({ onAddToBoard }: Props) {
  const [tab, setTab] = useState<'describe' | 'timetravel'>('describe');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/25">
          <Camera className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-base">AI Couple Photo</h3>
          <p className="text-white/40 text-xs">Visualize your future — describe it or upload real photos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-white/40 hover:text-white/65'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {tab === 'describe'   && <DescribeTab onAddToBoard={onAddToBoard} />}
          {tab === 'timetravel' && <TimeTravelTab onAddToBoard={onAddToBoard} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
