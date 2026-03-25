import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SocialShareMenu } from "@/components/SocialShareMenu";
import {
  Sparkles, ArrowLeft, Heart, AlertTriangle, TrendingUp, Zap,
  ChevronDown, ChevronUp, Share2, RefreshCw, Copy, CheckCircle2,
  Star, Clock, Flame, Shield, Users, Brain, DollarSign,
  Plane, Home, Laugh, Eye, Crown, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Scene {
  id: string;
  title: string;
  emoji: string;
  prediction: string;
  personAMove: string;
  personBMove: string;
  outcome: string;
  riskLevel: "Low" | "Medium" | "High";
  insightTip: string;
}

interface Timeline {
  title: string;
  year1: string;
  year3: string;
  year5: string;
  verdict: string;
  topIssue?: string;
}

interface Simulation {
  coupleLabel: string;
  overallScore: number;
  tagline: string;
  strengths: string[];
  risks: string[];
  scenes: Scene[];
  timelines: {
    stayTheSame: Timeline;
    doTheWork: Timeline;
  };
  shareableQuote: string;
}

interface SimulationResult {
  success: boolean;
  simulation: Simulation;
  userLabel: string;
  partnerLabel: string;
  userAvatar: string | null;
  partnerAvatar: string | null;
  hasRealPartner: boolean;
  generatedAt: string;
}

const SCENE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  stress: Brain,
  money: DollarSign,
  jealousy: Flame,
  travel: Plane,
  future: Home,
};

const RISK_CONFIG = {
  Low:    { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", bar: "bg-emerald-500", width: "w-1/3" },
  Medium: { color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",     bar: "bg-amber-500",   width: "w-2/3" },
  High:   { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         bar: "bg-red-500",     width: "w-full" },
};

const SCORE_GRADIENT = (s: number) =>
  s >= 75 ? "from-emerald-500 to-teal-500" :
  s >= 50 ? "from-amber-500 to-orange-500" :
             "from-red-500 to-rose-600";

const LOADING_STEPS = [
  "Reading personality blueprints...",
  "Analysing conflict patterns...",
  "Running 5-year projections...",
  "Detecting dealbreaker risks...",
  "Building your future scenarios...",
  "Finalising your simulation...",
];

function Avatar({ src, label, size = 64 }: { src: string | null; label: string; size?: number }) {
  const initials = label.slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={label}
      style={{ width: size, height: size }}
      className="rounded-full object-cover border-2 border-white/20 shadow-xl" />
  ) : (
    <div style={{ width: size, height: size }}
      className="rounded-full border-2 border-white/20 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
      {initials}
    </div>
  );
}

function SceneCard({
  scene, userLabel, partnerLabel, index,
}: {
  scene: Scene; userLabel: string; partnerLabel: string; index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_CONFIG[scene.riskLevel] || RISK_CONFIG.Medium;
  const Icon = SCENE_ICONS[scene.id] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-xl">
          {scene.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-semibold text-white text-sm">{scene.title}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${risk.bg} ${risk.color}`}>
                {scene.riskLevel} Risk
              </span>
              {expanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </div>
          </div>
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2">{scene.prediction}</p>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06] pt-4">
              <p className="text-white/70 text-sm leading-relaxed">{scene.prediction}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                  <p className="text-indigo-300 text-[10px] font-semibold uppercase tracking-wider mb-1">{userLabel}'s Move</p>
                  <p className="text-white/75 text-xs leading-relaxed">{scene.personAMove}</p>
                </div>
                <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3">
                  <p className="text-purple-300 text-[10px] font-semibold uppercase tracking-wider mb-1">{partnerLabel}'s Move</p>
                  <p className="text-white/75 text-xs leading-relaxed">{scene.personBMove}</p>
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Likely Outcome</p>
                <p className="text-white/80 text-sm">{scene.outcome}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-300 text-[10px] font-semibold uppercase tracking-wider mb-1">Insight Tip</p>
                  <p className="text-white/75 text-xs leading-relaxed">{scene.insightTip}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TimelineCard({ timeline, accent }: { timeline: Timeline; accent: string }) {
  const years = [
    { label: "Year 1", value: timeline.year1 },
    { label: "Year 3", value: timeline.year3 },
    { label: "Year 5", value: timeline.year5 },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4">
      <h4 className="font-bold text-white text-sm">{timeline.title}</h4>
      {timeline.topIssue && (
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">Focus:</span>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">{timeline.topIssue}</Badge>
        </div>
      )}
      <div className="space-y-3">
        {years.map((y, i) => (
          <div key={y.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full ${accent} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-px flex-1 bg-white/10 mt-1" />}
            </div>
            <div className="pb-3">
              <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{y.label}</span>
              <p className="text-white/75 text-sm mt-0.5 leading-relaxed">{y.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3 italic">
        <p className="text-white/60 text-sm">"{timeline.verdict}"</p>
      </div>
    </div>
  );
}

export default function FutureUsSimulator() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("partnerId");
  });

  const { data: userData } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const hasLinkedPartner = !!(userData?.linkedPartnerId || partnerId);

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/future-us/simulate", { partnerId }, { timeout: 50000 });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Simulation failed. Please try again.");
      }
      return res.json() as Promise<SimulationResult>;
    },
    onMutate: () => {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= LOADING_STEPS.length - 1) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 900);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast({ title: "Simulation failed", description: err.message, variant: "destructive" });
    },
  });

  const handleShare = async () => {
    if (!result) return;
    const sim = result.simulation;
    const text = [
      `🔮 Our Future Us Simulation — ${sim.coupleLabel} (${sim.overallScore}/100)`,
      '',
      `❝ ${sim.shareableQuote} ❞`,
      '',
      `💚 Strengths: ${sim.strengths.slice(0, 2).join(' · ')}`,
      '',
      'Try the Future Us Simulator on SyncWithInsight → syncwithinsight.com',
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: `Our Future Us — ${sim.coupleLabel}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const sim = result?.simulation;
  const scoreGrad = sim ? SCORE_GRADIENT(sim.overallScore) : "";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/harmony-hub">
            <button className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Future Us Simulator</span>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">AI</Badge>
            </h1>
            <p className="text-white/50 text-xs">AI Predicted Our Life in 5 Years</p>
          </div>
        </div>

        {/* Hero / Pre-generate state */}
        {!result && !simulateMutation.isPending && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-8">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="text-center space-y-2">
                  <Avatar src={userData?.profileImageUrl || null} label={userData?.displayName || userData?.firstName || "You"} size={72} />
                  <p className="text-white/70 text-sm font-medium">{userData?.displayName || userData?.firstName || "You"}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center gap-1"
                >
                  <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
                  <span className="text-white/30 text-[10px]">+</span>
                </motion.div>
                <div className="text-center space-y-2">
                  <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-white/20 bg-white/[0.04] flex items-center justify-center">
                    <Users className="w-7 h-7 text-white/30" />
                  </div>
                  <p className="text-white/40 text-sm">{hasLinkedPartner ? "Partner" : "Your Match"}</p>
                </div>
              </div>

              <div className="text-center space-y-3 mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-rose-300 bg-clip-text text-transparent">
                  See Your Future Together
                </h2>
                <p className="text-white/55 text-sm leading-relaxed max-w-sm mx-auto">
                  Our AI analyses your personality profiles and simulates 5 real-life scenarios — stress, money, jealousy, travel, and future planning — then maps out two possible futures.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: Brain, label: "5 Life Scenarios", color: "text-indigo-300", bg: "bg-indigo-500/10" },
                  { icon: TrendingUp, label: "5-Year Outlook", color: "text-emerald-300", bg: "bg-emerald-500/10" },
                  { icon: Share2, label: "Shareable Result", color: "text-purple-300", bg: "bg-purple-500/10" },
                ].map(({ icon: Icon, label, color, bg }) => (
                  <div key={label} className={`rounded-xl ${bg} border border-white/[0.06] p-3 text-center space-y-2`}>
                    <Icon className={`w-5 h-5 ${color} mx-auto`} />
                    <p className="text-white/60 text-[11px] font-medium leading-tight">{label}</p>
                  </div>
                ))}
              </div>

              {!hasLinkedPartner && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-5 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-200/80 text-xs leading-relaxed">
                    No partner linked yet. The AI will generate a compatible partner demonstration. Link a real partner in Harmony Hub for a personalised simulation.
                  </p>
                </div>
              )}

              <Button
                onClick={() => simulateMutation.mutate()}
                className="w-full h-13 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/25 text-base"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Run Our Simulation
              </Button>
            </div>

            <p className="text-white/25 text-[11px] text-center">
              Based on Big Five personality science, Gottman research & attachment theory. For entertainment and growth insight — not a guarantee.
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        {simulateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-10 text-center space-y-8"
          >
            <div className="relative mx-auto w-20 h-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border-2 border-transparent border-t-rose-500 border-l-pink-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-indigo-300" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg">Simulating Your Future</h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-white/50 text-sm"
                >
                  {LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-white/30 text-xs">
                <span>Running simulation</span>
                <span>{Math.round((loadingStep / (LOADING_STEPS.length - 1)) * 100)}%</span>
              </div>
              <Progress value={(loadingStep / (LOADING_STEPS.length - 1)) * 100} className="h-1.5 bg-white/10" />
            </div>

            <div className="grid grid-cols-6 gap-2">
              {LOADING_STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: i <= loadingStep ? 1 : 0.2, scale: i === loadingStep ? 1.2 : 1 }}
                  className={`h-1.5 rounded-full ${i <= loadingStep ? "bg-indigo-500" : "bg-white/10"}`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && sim && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Couple Hero Card */}
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-6">
              <div className="flex items-center justify-center gap-5 mb-5">
                <div className="text-center space-y-2">
                  <Avatar src={result.userAvatar} label={result.userLabel} size={60} />
                  <p className="text-white/70 text-xs font-medium">{result.userLabel}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${scoreGrad} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-black text-lg">{sim.overallScore}</span>
                  </div>
                  <span className="text-white/30 text-[10px] mt-1">match</span>
                </div>
                <div className="text-center space-y-2">
                  <Avatar src={result.partnerAvatar} label={result.partnerLabel} size={60} />
                  <p className="text-white/70 text-xs font-medium">
                    {result.partnerLabel}
                    {!result.hasRealPartner && <span className="text-white/30"> (demo)</span>}
                  </p>
                </div>
              </div>

              <div className="text-center space-y-2">
                <Badge className="bg-white/10 text-white/70 border-white/10 text-xs">{sim.coupleLabel}</Badge>
                <p className="text-white/80 text-sm font-medium leading-relaxed">{sim.tagline}</p>
              </div>
            </div>

            {/* Rich Shareable Card */}
            <div className="rounded-2xl border border-rose-500/25 overflow-hidden"
              style={{ background: 'linear-gradient(145deg,rgba(159,18,57,0.18) 0%,rgba(88,28,135,0.18) 50%,rgba(7,11,18,0.9) 100%)' }}>
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-3.5 h-3.5 text-rose-400" />
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Your Future Us Report</p>
                  </div>
                  <span className="text-[10px] text-white/25 font-medium">SyncWithInsight.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-3xl font-black" style={{ background: scoreGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      {sim.overallScore}
                    </p>
                    <p className="text-white/30 text-[10px] font-semibold">/ 100</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm leading-tight">{sim.coupleLabel}</p>
                    <p className="text-white/55 text-xs leading-snug mt-0.5 line-clamp-2">{sim.tagline}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-white/70 text-xs italic leading-relaxed mb-3">❝ {sim.shareableQuote} ❞</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {sim.strengths.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border border-emerald-500/20"
                        style={{ background: 'rgba(16,185,129,0.06)' }}>
                        <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-300/80 text-[10px] font-medium leading-tight line-clamp-1">{s}</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex-shrink-0 flex flex-col items-center gap-1 text-xs text-rose-300 hover:text-rose-200 transition-all bg-rose-500/15 hover:bg-rose-500/25 rounded-xl px-3 py-2.5 border border-rose-500/20"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    <span className="text-[10px] font-bold">{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="scenes">
              <TabsList className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 grid grid-cols-3">
                <TabsTrigger value="scenes" className="rounded-xl text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Scenarios
                </TabsTrigger>
                <TabsTrigger value="compat" className="rounded-xl text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Compatibility
                </TabsTrigger>
                <TabsTrigger value="futures" className="rounded-xl text-xs font-medium data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Two Futures
                </TabsTrigger>
              </TabsList>

              {/* Scenarios Tab */}
              <TabsContent value="scenes" className="mt-4 space-y-3">
                <p className="text-white/40 text-xs text-center">Tap any scenario to see the full breakdown</p>
                {sim.scenes.map((scene, i) => (
                  <SceneCard
                    key={scene.id}
                    scene={scene}
                    userLabel={result.userLabel}
                    partnerLabel={result.partnerLabel}
                    index={i}
                  />
                ))}
              </TabsContent>

              {/* Compatibility Tab */}
              <TabsContent value="compat" className="mt-4 space-y-4">
                {/* Score Ring */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-center space-y-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke="url(#grad)" strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - sim.overallScore / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-3xl font-black text-white">{sim.overallScore}</span>
                      <p className="text-white/40 text-[10px]">/ 100</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm">{sim.tagline}</p>
                </div>

                {/* Strengths */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-emerald-300 font-semibold text-sm">Your Strengths Together</h4>
                  </div>
                  <div className="space-y-2">
                    {sim.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/75 text-sm leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h4 className="text-red-300 font-semibold text-sm">Watch Out For</h4>
                  </div>
                  <div className="space-y-2">
                    {sim.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-white/75 text-sm leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk level breakdown from scenes */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3">
                  <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Scenario Risk Breakdown</h4>
                  {sim.scenes.map((scene) => {
                    const r = RISK_CONFIG[scene.riskLevel] || RISK_CONFIG.Medium;
                    return (
                      <div key={scene.id} className="flex items-center gap-3">
                        <span className="text-base w-6">{scene.emoji}</span>
                        <span className="text-white/60 text-xs w-28 flex-shrink-0">{scene.title}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.bar} ${r.width} transition-all duration-700`} />
                        </div>
                        <span className={`text-xs font-medium w-12 text-right ${r.color}`}>{scene.riskLevel}</span>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              {/* Two Futures Tab */}
              <TabsContent value="futures" className="mt-4 space-y-4">
                <p className="text-white/40 text-xs text-center leading-relaxed">
                  Two paths. Same couple. Very different outcomes.
                </p>
                <TimelineCard timeline={sim.timelines.stayTheSame} accent="bg-amber-500" />
                <TimelineCard timeline={sim.timelines.doTheWork} accent="bg-emerald-500" />
              </TabsContent>
            </Tabs>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => { setResult(null); simulateMutation.reset(); }}
                variant="outline"
                className="flex-1 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white/70 rounded-2xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-run
              </Button>
              <SocialShareMenu
                title="Our Future Us Simulation — SyncWithInsight"
                text={result?.simulation?.shareableQuote ? `"${result.simulation.shareableQuote}"\n\n🔮 Try Future Us Simulator on SyncWithInsight` : 'Check out our Future Us Simulation on SyncWithInsight!'}
                variant="default"
                className="flex-1 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white rounded-2xl font-semibold shadow-lg shadow-rose-500/20"
              />
            </div>

            <p className="text-white/20 text-[11px] text-center">
              Generated {new Date(result.generatedAt).toLocaleDateString()}. For insight and entertainment — not a guarantee.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
