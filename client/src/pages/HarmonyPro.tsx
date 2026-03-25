// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🔒 LOCKED — DO NOT MODIFY WITHOUT EXPLICIT APPROVAL                 ║
// ║  Status: VERIFIED WORKING ✅  (confirmed 2026-03-08)                 ║
// ║  Feature: Harmony Pro — individual AI coaching ("Private" badge)     ║
// ╚══════════════════════════════════════════════════════════════════════╝
import { CrisisBanner } from '@/components/CrisisBanner';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ONBOARDING_MODE } from '@/lib/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Heart, Gavel, Flame, Languages, ArrowLeft,
  Sparkles, Clock, MessageSquare, Lightbulb, Copy, Check,
  RotateCcw, AlertTriangle, Brain, CreditCard, Crown, Zap,
  ChevronRight, Timer, Lock, Activity, Share2, Users, Dna,
  Volume2, VolumeX, Camera, Video
} from 'lucide-react';

type CoachMode = 'coach' | 'fight-judge' | 'kamasutra' | 'love-language' | 'relationship-health';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  shared?: boolean;
  erosSuggestion?: {
    partner: string;
    text: string;
    cta: string;
    url: string;
  };
  affiliateSuggestion?: {
    partner: string;
    label: string;
    url: string;
  };
}

interface HoursStatus {
  therapyId: string;
  hoursRemaining: number;
  subscriptionActive: boolean;
  freeTrialUsed: boolean;
  freeTrialActive: boolean;
  freeTrialExpired: boolean;
  freeTrialEndDate?: string;
}

const MODES: {
  id: CoachMode; label: string; icon: any; gradient: string; border: string;
  glow: string; aiName: string; tagline: string; description: string;
  avatarBg: string; quickPrompts: string[]; welcome: string;
}[] = [
  {
    id: 'coach', label: 'AI Coach', icon: Heart,
    gradient: 'from-teal-500 to-emerald-600', border: 'border-teal-500/40', glow: 'shadow-teal-500/20',
    aiName: 'Harmony', tagline: 'Your Relationship Coach',
    description: 'Supportive guidance, communication strategies, and expert insights',
    avatarBg: 'from-teal-500 to-emerald-600',
    quickPrompts: [
      "We keep having the same argument over and over",
      "How do I express my needs without pushing them away?",
      "I feel like we've grown apart lately",
      "How can we rebuild trust after a hard period?",
    ],
    welcome: "Hi! I'm Harmony, your AI relationship coach. I'm here to help you navigate the beautiful complexity of love. Whether it's communication, trust, growth or simply understanding each other better — I'm in your corner. What's on your heart today?",
  },
  {
    id: 'fight-judge', label: 'Fight Judge', icon: Gavel,
    gradient: 'from-red-500 to-rose-600', border: 'border-red-500/40', glow: 'shadow-red-500/20',
    aiName: 'Judge', tagline: 'Neutral AI Mediator',
    description: 'Objectively analyzes conflicts and suggests fair resolutions',
    avatarBg: 'from-red-500 to-rose-600',
    quickPrompts: [
      "He never helps with the dishes and says I'm nagging",
      "We argued about money and neither of us will back down",
      "She says I don't listen but I feel like she doesn't either",
      "We disagree about how to spend our free time",
    ],
    welcome: "⚖️ Court is in session. I'm your neutral Fight Judge — no sides, no bias. Tell me your disagreement and I'll give each of you a fair hearing, then deliver my verdict with actionable steps forward. Who goes first?",
  },
  {
    id: 'kamasutra', label: 'Intimacy Coach', icon: Flame,
    gradient: 'from-orange-500 to-rose-600', border: 'border-orange-500/40', glow: 'shadow-orange-500/20',
    aiName: 'Ember', tagline: 'Connection & Intimacy Guide',
    description: 'Tasteful, science-backed guidance for deepening your intimate connection',
    avatarBg: 'from-orange-500 to-rose-600',
    quickPrompts: [
      "How can we bring back the spark we had early on?",
      "We feel disconnected physically lately",
      "How do we talk about our needs without it being awkward?",
      "What are some ways to build more emotional intimacy?",
    ],
    welcome: "🔥 Welcome. I'm Ember, your intimacy and connection coach. This is a safe, respectful space to explore ways of deepening your bond — emotional, physical, and spiritual. What aspect of your connection would you like to nurture?",
  },
  {
    id: 'love-language', label: 'Love Language', icon: Languages,
    gradient: 'from-teal-500 to-cyan-600', border: 'border-teal-500/40', glow: 'shadow-teal-500/20',
    aiName: 'Lyra', tagline: 'Love Language Decoder',
    description: 'Discover how you and your partner give and receive love',
    avatarBg: 'from-teal-500 to-cyan-600',
    quickPrompts: [
      "I show love through acts of service but they want words",
      "Help me figure out my partner's love language",
      "Why do I feel unloved even when they say they care?",
      "How do I speak my partner's love language naturally?",
    ],
    welcome: "💬 Hello! I'm Lyra, your Love Language Decoder. The 5 love languages — Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, and Physical Touch — explain so much about why couples feel disconnected even when they truly love each other. Tell me about your relationship and I'll help you decode your unique love blueprint.",
  },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function HarmonyPro() {
  const [mode, setMode] = useState<CoachMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode') as CoachMode | null;
    return m && ['coach','fight-judge','kamasutra','love-language','relationship-health'].includes(m) ? m : 'coach';
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [activatingTrial, setActivatingTrial] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const harmonyAudioRef = useRef<HTMLAudioElement | null>(null);
  const harmonyPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const harmonyVideoInputRef = useRef<HTMLInputElement | null>(null);
  const [harmonyMediaAnalyzing, setHarmonyMediaAnalyzing] = useState(false);

  const speakHarmonyMessage = async (text: string, idx: number) => {
    if (!ONBOARDING_MODE && !hoursStatus?.subscriptionActive) {
      toast({ title: '🎙️ Voice is a Harmony subscriber feature', description: 'Subscribe to Harmony to hear me speak to you.' });
      return;
    }
    if (speakingIdx === idx) {
      harmonyAudioRef.current?.pause();
      setSpeakingIdx(null);
      return;
    }
    harmonyAudioRef.current?.pause();
    setSpeakingIdx(idx);
    try {
      const res = await apiRequest('POST', '/api/tts', { text, character: 'harmony' });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        harmonyAudioRef.current = audio;
        audio.onended = () => setSpeakingIdx(null);
        audio.onerror = () => setSpeakingIdx(null);
        audio.play();
      }
    } catch {
      toast({ title: 'Voice unavailable', description: 'Could not generate audio.', variant: 'destructive' });
      setSpeakingIdx(null);
    }
  };

  const handleHarmonyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHarmonyMediaAnalyzing(true);
    setMessages(prev => [...prev, { role: 'user', content: `📸 Sharing a photo: ${file.name}` }]);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/photo-analysis/body-language', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      const analysis = data.analysis || data.result || data.message || 'I looked at this carefully. Here is my reflection.';
      setMessages(prev => [...prev, { role: 'assistant', content: `📸 **What I see in this photo**\n\n${analysis}` }]);
    } catch {
      toast({ title: 'Photo analysis failed', description: 'Please try again.', variant: 'destructive' });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setHarmonyMediaAnalyzing(false);
      if (harmonyPhotoInputRef.current) harmonyPhotoInputRef.current.value = '';
    }
  };

  const handleHarmonyVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHarmonyMediaAnalyzing(true);
    setMessages(prev => [...prev, { role: 'user', content: `🎙️ Sharing audio/video: ${file.name}` }]);
    try {
      const formData = new FormData();
      formData.append('audio', file);
      const res = await fetch('/api/audio-analysis/eros', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      const analysis = data.analysis || data.result || data.message || 'I listened to this. Here is my reflection.';
      setMessages(prev => [...prev, { role: 'assistant', content: `🎙️ **What I heard**\n\n${analysis}` }]);
    } catch {
      toast({ title: 'Audio analysis failed', description: 'Please try again.', variant: 'destructive' });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setHarmonyMediaAnalyzing(false);
      if (harmonyVideoInputRef.current) harmonyVideoInputRef.current.value = '';
    }
  };

  const currentMode = MODES.find(m => m.id === mode)!;
  const userMessageCount = messages.filter(m => m.role === 'user').length;

  // Fetch hours status
  const { data: hoursStatus, isLoading: hoursLoading, refetch: refetchHours } = useQuery<HoursStatus>({
    queryKey: ['/api/coaching/hours-status'],
    staleTime: 30000,
  });

  // Calculate remaining coaching time
  const totalAllowedSeconds = (hoursStatus?.hoursRemaining || 0) * 3600;
  const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const usagePercent = totalAllowedSeconds > 0 ? Math.min(100, (elapsedSeconds / totalAllowedSeconds) * 100) : 0;
  const isTrial = hoursStatus?.freeTrialActive && !hoursStatus?.subscriptionActive;
  const hasAccess = ONBOARDING_MODE || (hoursStatus && (hoursStatus.hoursRemaining > 0) && (hoursStatus.freeTrialActive || hoursStatus.subscriptionActive));
  const needsTrial = !ONBOARDING_MODE && (hoursStatus && !hoursStatus.freeTrialUsed);
  const trialExpired = !ONBOARDING_MODE && hoursStatus?.freeTrialExpired;

  // Warning thresholds
  const isLowTime = remainingMinutes <= 10 && remainingMinutes > 0;
  const isCriticalTime = remainingMinutes <= 3 && remainingMinutes > 0;

  // Start / stop elapsed timer
  useEffect(() => {
    if (ONBOARDING_MODE || !hasAccess || timeExpired) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (totalAllowedSeconds > 0 && next >= totalAllowedSeconds) {
          clearInterval(timerRef.current!);
          setTimeExpired(true);
          setShowUpgradeModal(true);
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasAccess, timeExpired, totalAllowedSeconds]);

  // Mode change: reset messages
  useEffect(() => {
    setMessages([{ role: 'assistant', content: currentMode.welcome, timestamp: new Date() }]);
    setInput('');
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Low time warning toast
  useEffect(() => {
    if (isCriticalTime && !timeExpired) {
      toast({ title: '⏱️ 3 minutes remaining', description: 'Your coaching session is almost up.', variant: 'destructive' });
    }
  }, [isCriticalTime]);

  const activateTrial = async () => {
    setActivatingTrial(true);
    try {
      const res = await fetch('/api/coaching/activate-trial', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: '🎉 Trial activated!', description: '1 hour of free coaching — enjoy!' });
        refetchHours();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not activate trial', variant: 'destructive' });
    } finally {
      setActivatingTrial(false);
    }
  };

  const sendMessage = async (text?: string) => {
    if (timeExpired) { setShowUpgradeModal(true); return; }
    const msgText = text || input;
    if (!msgText.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: msgText, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/harmony/chat', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: msgText, 
          sessionType: mode === 'coach' ? 'individual' : mode === 'fight-judge' ? 'individual' : 'individual' // Simplified for now
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response, 
        timestamp: new Date(),
        erosSuggestion: data.erosSuggestion,
        affiliateSuggestion: data.affiliateSuggestion 
      }]);
    } catch {
      toast({ title: 'Error', description: 'Failed to get response. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const Icon = currentMode.icon;

  // ── Loading ──────────────────────────────────────────────────────────
  if (hoursLoading && !ONBOARDING_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/40 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500/20 animate-pulse flex items-center justify-center">
            <Brain className="w-6 h-6 text-teal-300" />
          </div>
          <p className="text-white/40 text-sm">Loading your coaching session...</p>
        </div>
      </div>
    );
  }

  // ── Needs Trial Activation ────────────────────────────────────────────
  if (needsTrial && !hoursStatus?.freeTrialActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/40 to-slate-900 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <Button variant="ghost" onClick={() => navigate('/harmony-hub')} className="text-white/50 hover:text-white mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> Harmony Hub
          </Button>
          <Card className="bg-gradient-to-br from-teal-900/40 via-teal-900/30 to-indigo-900/20 border border-teal-500/25 rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 mb-4">3-Day Free Trial</Badge>
              <h2 className="text-2xl font-bold text-white mb-3">Start Your Free Coaching Session</h2>
              <p className="text-white/55 text-sm leading-relaxed mb-6">
                Get <span className="text-teal-300 font-semibold">1 hour of free AI coaching</span> — no credit card required. After your trial, upgrade to Harmony Hub for 3 hours of coaching per month.
              </p>
              <div className="bg-white/[0.04] rounded-2xl p-4 mb-6 space-y-2 text-left">
                {[
                  "AI Relationship Coach (5 modes)",
                  "Fight Judge conflict mediation",
                  "Love Language decoder",
                  "Intimacy & connection coaching",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Button onClick={activateTrial} disabled={activatingTrial}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold rounded-2xl py-3 gap-2 shadow-lg shadow-teal-500/25">
                {activatingTrial ? 'Activating...' : '🎉 Start 1-Hour Free Session'}
              </Button>
              <p className="text-xs text-white/30 mt-3">3-day trial · 1 hour coaching · No payment needed</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Trial/Subscription Expired (no hours, no active trial) ───────────
  if ((trialExpired || (hoursStatus?.freeTrialUsed && !hoursStatus?.subscriptionActive)) && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/40 to-slate-900 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <Button variant="ghost" onClick={() => navigate('/harmony-hub')} className="text-white/50 hover:text-white mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" /> Harmony Hub
          </Button>
          <Card className="bg-slate-800/40 border border-white/[0.08] rounded-3xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Your Free Session Has Ended</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Upgrade to Harmony Hub to continue — <span className="text-teal-300 font-semibold">3 hours of AI coaching per month</span>, plus all enrichment tools.
              </p>
              <div className="bg-gradient-to-br from-teal-900/30 to-emerald-900/20 border border-teal-500/20 rounded-2xl p-4 mb-6">
                <div className="text-2xl font-bold text-white">$49<span className="text-sm text-white/40 font-normal">/mo per couple</span></div>
                <p className="text-xs text-teal-300/60 mb-3">Flat rate — both partners included</p>
                <div className="space-y-1.5">
                  {["3 hours AI coaching / month", "Fight Judge & Love Language", "EchoBond Chamber", "Compliment Jar & Share Log", "+3 hr add-on available for $39.99"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-white/60">
                      <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => navigate('/subscription-plans')}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-2xl py-3 gap-2 shadow-lg shadow-teal-500/20">
                <CreditCard className="w-4 h-4" /> Upgrade to Harmony Hub
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/40 to-slate-900">

      {/* Upgrade Modal Overlay */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/25 rounded-3xl shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
                    <Timer className="w-8 h-8 text-amber-400" />
                  </div>
                  {isTrial ? (
                    <>
                      <h2 className="text-xl font-bold text-white mb-2">Your Free Hour Is Up</h2>
                      <p className="text-white/50 text-sm leading-relaxed mb-5">
                        Hope that was helpful! Upgrade to Harmony Hub for <span className="text-teal-300 font-semibold">3 hours of coaching per month</span> and all the enrichment tools.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-white mb-2">Monthly Hours Used</h2>
                      <p className="text-white/50 text-sm leading-relaxed mb-5">
                        You've used your 3 monthly hours. Add <span className="text-teal-300 font-semibold">3 more hours for $39.99</span> — or wait for next month's reset.
                      </p>
                    </>
                  )}
                  <div className="space-y-3">
                    {isTrial ? (
                      <Button onClick={() => navigate('/subscription-plans')}
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-2xl py-3 gap-2">
                        <Crown className="w-4 h-4" /> Upgrade — $49/mo per couple
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/subscription-plans')}
                        className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-2xl py-3 gap-2">
                        <Zap className="w-4 h-4" /> Add 3 Hours — $39.99
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => navigate('/harmony-hub')}
                      className="w-full text-white/40 hover:text-white text-sm">
                      Return to Harmony Hub
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button onClick={() => navigate('/harmony-hub')} variant="ghost" size="sm"
            className="text-white/60 hover:text-white hover:bg-white/[0.06] rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Harmony Hub
          </Button>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentMode.gradient} animate-pulse`} />
            <span className="text-sm font-semibold text-white">{currentMode.aiName}</span>
            <span className="text-white/40 text-xs hidden sm:inline">{currentMode.tagline}</span>
          </div>

          {/* Time Remaining Indicator */}
          <div className="flex items-center gap-3">
            {!ONBOARDING_MODE && hasAccess && totalAllowedSeconds > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                timeExpired ? 'bg-red-500/20 border-red-500/30 text-red-300' :
                isCriticalTime ? 'bg-red-500/15 border-red-500/25 text-red-300 animate-pulse' :
                isLowTime ? 'bg-amber-500/15 border-amber-500/25 text-amber-300' :
                'bg-white/[0.06] border-white/[0.08] text-white/50'
              }`}>
                <Timer className="w-3 h-3" />
                {timeExpired ? 'Expired' : formatTime(remainingSeconds)}
                {isTrial && <span className="text-[9px] opacity-60 ml-0.5">trial</span>}
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-white/30">
                <MessageSquare className="w-3 h-3" />{userMessageCount}
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/10 border border-violet-400/20">
                <Lock className="w-2.5 h-2.5 text-violet-400" />
                <span className="text-[10px] text-violet-300 font-medium">Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar for time usage */}
        {!ONBOARDING_MODE && hasAccess && totalAllowedSeconds > 0 && (
          <div className="w-full h-0.5 bg-white/[0.04]">
            <div
              className={`h-full transition-all duration-1000 ${
                usagePercent > 90 ? 'bg-red-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Time warning banner */}
      <AnimatePresence>
        {!ONBOARDING_MODE && isLowTime && !timeExpired && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`px-4 py-2.5 text-center text-xs font-medium border-b ${isCriticalTime ? 'bg-red-900/30 border-red-500/20 text-red-300' : 'bg-amber-900/20 border-amber-500/15 text-amber-300'}`}>
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            {isCriticalTime
              ? `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} remaining — `
              : `${remainingMinutes} minutes remaining in your ${isTrial ? 'free trial' : 'monthly allowance'} — `}
            <button onClick={() => setShowUpgradeModal(true)} className="underline font-semibold">
              {isTrial ? 'Upgrade to continue' : 'Add 3 hours for $39.99'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`max-w-4xl mx-auto px-4 py-6 ${timeExpired ? 'pointer-events-none opacity-50' : ''}`}>

        {/* Mode Selector */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-max">
            {MODES.map((m) => {
              const MIcon = m.icon;
              const isActive = mode === m.id;
              return (
                <motion.button key={m.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setMode(m.id); setInput(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? `bg-gradient-to-r ${m.gradient} text-white border-transparent shadow-lg ${m.glow}`
                      : 'bg-white/[0.04] text-white/60 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                  }`}>
                  <MIcon className="w-4 h-4" />{m.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Mode Card */}
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mb-4">
            <div className={`rounded-2xl p-4 bg-gradient-to-r ${currentMode.gradient} bg-opacity-10 border ${currentMode.border} backdrop-blur-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentMode.avatarBg} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">{currentMode.aiName} — {currentMode.tagline}</div>
                  <div className="text-white/60 text-xs">{currentMode.description}</div>
                </div>
                {isTrial && (
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px]">Free Trial</Badge>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Chat Window */}
        <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl backdrop-blur-sm mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[420px] overflow-y-auto p-4 space-y-4 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 group`}>
                    {msg.role === 'assistant' && (
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${currentMode.avatarBg} flex items-center justify-center flex-shrink-0 mt-1`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className="max-w-[80%] space-y-1">
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-tr-sm'
                          : 'bg-white/[0.06] text-white/90 border border-white/[0.06] rounded-tl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {msg.erosSuggestion && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                          <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 shadow-lg overflow-hidden border">
                            <CardContent className="p-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                  <Sparkles className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-white/90">{msg.erosSuggestion.text}</div>
                                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Sponsored Suggestion</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await apiRequest("POST", "/api/affiliate/track-click", {
                                      partner: msg.erosSuggestion!.partner,
                                      context: "harmony_coaching_chat",
                                    });
                                    if (msg.erosSuggestion!.url.startsWith('/')) {
                                      navigate(msg.erosSuggestion!.url);
                                    } else {
                                      window.open(msg.erosSuggestion!.url, '_blank', 'noopener,noreferrer');
                                    }
                                  } catch (e) {
                                    if (msg.erosSuggestion!.url.startsWith('/')) {
                                      navigate(msg.erosSuggestion!.url);
                                    } else {
                                      window.open(msg.erosSuggestion!.url, '_blank', 'noopener,noreferrer');
                                    }
                                  }
                                }}
                                className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] h-7 px-3 rounded-lg font-bold"
                              >
                                {msg.erosSuggestion.cta} <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      {msg.affiliateSuggestion && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                          <Card className="bg-gradient-to-br from-blue-500/10 to-teal-500/10 border-teal-500/20 shadow-lg overflow-hidden border">
                            <CardContent className="p-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-500/20 rounded-lg">
                                  <Sparkles className="w-4 h-4 text-teal-400" />
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-teal-100/60 uppercase tracking-wider">Harmony suggests:</div>
                                  <div className="text-sm font-semibold text-white">{msg.affiliateSuggestion.label}</div>
                                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Sponsored</div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await apiRequest("POST", "/api/affiliate/track-click", {
                                      partner: msg.affiliateSuggestion!.partner,
                                      context: "harmony_coaching_chat_keyword",
                                    });
                                    window.open(msg.affiliateSuggestion!.url, '_blank', 'noopener,noreferrer');
                                  } catch (e) {
                                    window.open(msg.affiliateSuggestion!.url, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] h-7 px-3 rounded-lg font-bold"
                              >
                                Get Started <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}

                      <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-white/30">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.role === 'assistant' && (
                          <>
                            <button onClick={() => copyMessage(msg.content, idx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/60">
                              {copiedIdx === idx ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => speakHarmonyMessage(msg.content, idx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-teal-400"
                              title={speakingIdx === idx ? 'Stop' : 'Listen to Harmony'}
                            >
                              {speakingIdx === idx
                                ? <VolumeX className="w-3 h-3 text-teal-400" />
                                : <Volume2 className="w-3 h-3" />
                              }
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start gap-2">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${currentMode.avatarBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white/[0.06] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 bg-white/40 rounded-full"
                          animate={{ y: [0, -6, 0] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Quick Prompts */}
        <AnimatePresence>
          {userMessageCount === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-white/50">Conversation starters</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentMode.quickPrompts.map((prompt, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs text-white/70 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2.5 transition-all leading-relaxed">
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <input ref={harmonyPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleHarmonyPhotoUpload} />
        <input ref={harmonyVideoInputRef} type="file" accept="video/*,audio/*" className="hidden" onChange={handleHarmonyVideoUpload} />
        <div className="flex gap-1.5 items-end">
          <button
            onClick={() => harmonyPhotoInputRef.current?.click()}
            disabled={harmonyMediaAnalyzing || timeExpired}
            title="Share a photo for Harmony to reflect on"
            className="flex-shrink-0 w-13 h-[52px] rounded-2xl bg-white/[0.04] hover:bg-teal-500/15 border border-white/[0.08] hover:border-teal-400/30 flex items-center justify-center transition-all disabled:opacity-40"
          >
            <Camera className="w-4 h-4 text-white/50" />
          </button>
          <button
            onClick={() => harmonyVideoInputRef.current?.click()}
            disabled={harmonyMediaAnalyzing || timeExpired}
            title="Share audio/video for Harmony to analyze"
            className="flex-shrink-0 w-13 h-[52px] rounded-2xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/[0.08] hover:border-emerald-400/30 flex items-center justify-center transition-all disabled:opacity-40"
          >
            <Video className="w-4 h-4 text-white/50" />
          </button>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={timeExpired ? 'Session time expired — upgrade to continue' : `Message ${currentMode.aiName}... (Enter to send, Shift+Enter for new line)`}
            className="flex-1 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 resize-none rounded-2xl focus:border-teal-500/50 text-sm min-h-[52px] max-h-[120px]"
            rows={2}
            disabled={loading || timeExpired || harmonyMediaAnalyzing}
          />
          <Button onClick={() => sendMessage()}
            disabled={loading || !input.trim() || timeExpired || harmonyMediaAnalyzing}
            className={`bg-gradient-to-r ${currentMode.gradient} hover:opacity-90 text-white rounded-2xl h-[52px] w-[52px] p-0 flex items-center justify-center shadow-lg transition-all disabled:opacity-40`}>
            {timeExpired ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-[11px] text-white/25 text-center mt-4 leading-relaxed">
          AI coaching for general guidance only — not a substitute for licensed professional support.
        </p>
      </div>
      <CrisisBanner />
    </div>
  );
}
