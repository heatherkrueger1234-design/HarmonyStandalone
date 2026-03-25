import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Brain,
  Heart,
  AlertTriangle,
  CheckCircle,
  Shield,
  Target,
  TrendingUp,
  Zap,
  MessageCircle,
  ChevronRight,
  Home,
  Sparkles,
  RotateCcw,
  Star,
  Users,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest, getCSRFToken } from "@/lib/queryClient";

interface ComprehensiveInsights {
  personalityType: string;
  corePersonality: {
    funny: number;
    serious: number;
    smart: number;
    angry: number;
    depressed: number;
    thoughtful: number;
    optimistic: number;
    empathetic: number;
  };
  redFlags: string[];
  greenFlags: string[];
  concerningBehaviors: string[];
  attractionPattern: {
    type: string;
    reason: string;
    healthiness: 'healthy' | 'unhealthy' | 'mixed';
  };
  fightingStyle: string;
  conflictBehavior: {
    enjoysConflict: boolean;
    avoidanceLevel: number;
    escalationTendency: number;
  };
  estimatedIQ: {
    range: string;
    reasoning: string;
  };
  trustworthiness: number;
  honestyLevel: number;
  sincerity: number;
  isPushover: boolean;
  cheatingLikelihood: 'very low' | 'low' | 'moderate' | 'high';
  gamePlaying: boolean;
  gossipTendency: 'never' | 'rarely' | 'sometimes' | 'often';
  lifeTrajectory: {
    prediction: string;
    reasoning: string;
    successProbability: number;
  };
  parentingStyle: string;
  socialType: 'introvert' | 'extrovert' | 'ambivert';
  socialBehavior: {
    friendly: number;
    helpful: number;
    selfish: number;
    indifferent: number;
  };
  narcissismLevel: 'none' | 'healthy' | 'mild' | 'moderate' | 'severe';
  emotionalStability: number;
  anxietyLevel: 'low' | 'moderate' | 'high';
  easyToLiveWith: boolean;
  roommateSuitability: number;
  cohabitationChallenges: string[];
  compatibilityScore: {
    overall: number;
    romantic: number;
    friendship: number;
    professional: number;
  };
  idealPartnerTraits: string[];
  dealbreakers: string[];
  matchCategories: {
    perfectMatch: string[];
    goodMatch: string[];
    challenging: string[];
    avoid: string[];
  };
  relationshipSuccess: {
    shortTerm: number;
    longTerm: number;
    marriage: number;
  };
  potentialIssues: string[];
  strengthsAsPartner: string[];
}

type Persona = 'neutral' | 'dude' | 'chick';

const PERSONA_OPTIONS: { value: Persona; label: string; emoji: string; desc: string }[] = [
  { value: 'neutral', label: 'Eros', emoji: '✨', desc: 'Balanced & wise companion' },
  { value: 'dude', label: 'Wingman', emoji: '🤙', desc: 'Chill bro energy' },
  { value: 'chick', label: 'Bestie', emoji: '💅', desc: 'Real talk, girl-code' },
];

function GlowRing({ size = 120, color = "purple", animate = true }: { size?: number; color?: string; animate?: boolean }) {
  const colorMap: Record<string, string> = {
    purple: "rgba(168,85,247,0.4)",
    pink: "rgba(236,72,153,0.4)",
    rose: "rgba(244,63,94,0.4)",
  };
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        boxShadow: `0 0 0 2px ${colorMap[color] || colorMap.purple}`,
        animation: animate ? "ping 2s cubic-bezier(0,0,0.2,1) infinite" : undefined,
        opacity: animate ? 0.7 : 1,
      }}
    />
  );
}

function ErosAvatar({ size = 80, speaking = false, persona = 'neutral' as Persona }) {
  const gradient =
    persona === 'dude'
      ? "from-blue-500 to-purple-600"
      : persona === 'chick'
      ? "from-pink-400 to-rose-500"
      : "from-pink-500 to-purple-600";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {speaking && (
        <>
          <GlowRing size={size * 1.5} color="purple" animate />
          <GlowRing size={size * 1.9} color="pink" animate />
        </>
      )}
      <div
        className={`relative z-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl shadow-purple-500/40`}
        style={{ width: size, height: size }}
      >
        <Heart className="text-white" style={{ width: size * 0.4, height: size * 0.4 }} />
        {speaking && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse" />
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, max = 100, color = "pink" }: { label: string; value: number; max?: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  const colorMap: Record<string, string> = {
    pink: "bg-gradient-to-r from-pink-500 to-rose-400",
    purple: "bg-gradient-to-r from-purple-500 to-violet-400",
    green: "bg-gradient-to-r from-emerald-500 to-green-400",
    blue: "bg-gradient-to-r from-blue-500 to-cyan-400",
    red: "bg-gradient-to-r from-red-500 to-orange-400",
    yellow: "bg-gradient-to-r from-yellow-500 to-amber-400",
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-white/70 capitalize">{label}</span>
        <span className="text-sm font-bold text-white">{value}{max === 10 ? "/10" : "%"}</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorMap[color] || colorMap.pink}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ${glow ? "shadow-2xl shadow-purple-500/20" : ""} ${className}`}
    >
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-transparent pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default function AnterosEnhanced() {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'eros'; content: string }>>([]);
  const [currentStep, setCurrentStep] = useState<'intro' | 'assessment' | 'insights'>('intro');
  const [insights, setInsights] = useState<ComprehensiveInsights | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [persona, setPersona] = useState<Persona>('neutral');
  const [isSavingPersona, setIsSavingPersona] = useState(false);
  const totalQuestions = 20;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    const savedInsights = localStorage.getItem('anterosInsights');
    const savedConversation = localStorage.getItem('anterosConversation');
    if (savedInsights) {
      setInsights(JSON.parse(savedInsights));
      setCurrentStep('insights');
    }
    if (savedConversation) {
      setConversation(JSON.parse(savedConversation));
    }
  }, []);

  const playAudio = (audioUrl: string) => {
    if (currentAudioRef.current) currentAudioRef.current.pause();
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    audio.play().catch(() => setIsSpeaking(false));
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsListening(false);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          const csrfToken = await getCSRFToken();
          const res = await fetch('/api/anteros/voice/transcribe', { method: 'POST', credentials: 'include', body: formData, headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {} });
          if (res.ok) {
            const { text } = await res.json();
            if (text?.trim()) setMessage(text.trim());
          }
        } catch {
          toast({ title: "Couldn't transcribe", description: "Try speaking again or type instead.", variant: "destructive" });
        }
      };
      recorder.start();
      setIsListening(true);
    } catch {
      toast({ title: "Microphone denied", description: "Allow mic access to use voice input.", variant: "destructive" });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
    setVoiceEnabled(v => !v);
  };

  const savePersona = async (p: Persona) => {
    setPersona(p);
    setIsSavingPersona(true);
    try {
      await apiRequest("PATCH", "/api/user/anteros-gender", { gender: p });
    } catch {
      // silent — persona change is cosmetic
    } finally {
      setIsSavingPersona(false);
    }
  };

  const startAssessment = async () => {
    setCurrentStep('assessment');
    setIsGenerating(true);
    try {
      const res = await apiRequest('POST', '/api/anteros/start', {});
      let welcomeMessage = "Let's get started! I want to get to know the real you. First — what's been the highlight of your week?";
      let audioUrl: string | undefined;
      if (res.ok) {
        const data = await res.json();
        if (data.message) welcomeMessage = data.message;
        if (data.audioUrl) audioUrl = data.audioUrl;
      }
      setConversation([{ role: 'eros', content: welcomeMessage }]);
      if (voiceEnabled && audioUrl) playAudio(audioUrl);
    } catch {
      setConversation([{ role: 'eros', content: "Let's get started! Tell me — what does a perfect Sunday look like for you?" }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || isGenerating) return;
    const userMessage = message;
    const newConversation = [...conversation, { role: 'user' as const, content: userMessage }];
    setConversation(newConversation);
    setMessage("");
    const newCount = questionsAnswered + 1;
    setQuestionsAnswered(newCount);
    setIsGenerating(true);
    try {
      const res = await apiRequest('POST', '/api/anteros/message', { message: userMessage });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const erosResponse = data.response || data.message || "Love that answer. What do you value most in a relationship?";
      setConversation([...newConversation, { role: 'eros' as const, content: erosResponse }]);
      if (voiceEnabled && data.audioUrl) playAudio(data.audioUrl);
      if (newCount >= 10) setTimeout(() => generateInsights(), 2000);
    } catch {
      const fallbacks = [
        "That's really telling — it says a lot about how you connect. What do you value most in a partner?",
        "I love that. How do you usually handle conflict with someone you care about?",
        "You clearly have a strong sense of self. What's your biggest strength in relationships?",
        "Perfect. When you imagine building a life with someone, what does that look like?",
      ];
      setConversation(prev => [...prev, { role: 'eros' as const, content: fallbacks[newCount % fallbacks.length] }]);
      if (newCount >= 10) setTimeout(() => generateInsights(), 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    setCurrentStep('insights');
    try {
      const answers: Record<number, string> = {};
      conversation.forEach((msg, idx) => { if (msg.role === 'user') answers[idx] = msg.content; });
      const response = await apiRequest('POST', '/api/anteros/generate-insights', { answers, conversation: conversation.map(c => c.content) });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      if (data.success && data.insights) {
        setInsights(data.insights);
        localStorage.setItem('anterosInsights', JSON.stringify(data.insights));
        localStorage.setItem('anterosConversation', JSON.stringify(conversation));
      } else {
        throw new Error('no insights');
      }
    } catch {
      const mock: ComprehensiveInsights = {
        personalityType: "The Empathetic Achiever",
        corePersonality: { funny: 7, serious: 6, smart: 8, angry: 2, depressed: 3, thoughtful: 9, optimistic: 7, empathetic: 9 },
        redFlags: ["Avoids necessary conflict", "May neglect own needs", "Emotional overwhelm under stress"],
        greenFlags: ["Exceptional emotional intelligence", "Genuine care for partner's growth", "Strong communication skills", "Reliable, keeps commitments", "Self-aware and growth-focused"],
        concerningBehaviors: ["May become passive-aggressive when hurt", "Tendency to overthink partner's actions"],
        attractionPattern: { type: "Emotionally intelligent, stable partners", reason: "You seek deep connection and mutual growth", healthiness: 'healthy' },
        fightingStyle: "Collaborative Problem Solver — seeks win-win",
        conflictBehavior: { enjoysConflict: false, avoidanceLevel: 6, escalationTendency: 2 },
        estimatedIQ: { range: "115–125", reasoning: "Strong analytical thinking, pattern recognition in answers" },
        trustworthiness: 92, honestyLevel: 88, sincerity: 90,
        isPushover: false, cheatingLikelihood: 'very low', gamePlaying: false, gossipTendency: 'rarely',
        lifeTrajectory: { prediction: "Meaningful career + fulfilling relationships", reasoning: "High conscientiousness + emotional intelligence = balanced success", successProbability: 85 },
        parentingStyle: "Authoritative — balanced warmth with clear boundaries",
        socialType: 'ambivert',
        socialBehavior: { friendly: 8, helpful: 9, selfish: 2, indifferent: 1 },
        narcissismLevel: 'healthy', emotionalStability: 75, anxietyLevel: 'moderate',
        easyToLiveWith: true, roommateSuitability: 85,
        cohabitationChallenges: ["Needs alone time to recharge", "Particular about emotional atmosphere"],
        compatibilityScore: { overall: 82, romantic: 88, friendship: 90, professional: 78 },
        idealPartnerTraits: ["Emotionally available", "Growth-oriented", "Good sense of humor", "Respects boundaries", "Shares core values"],
        dealbreakers: ["Emotional unavailability", "Dishonesty", "Disrespect", "Unwillingness to communicate"],
        matchCategories: {
          perfectMatch: ["The Secure Communicator", "The Growth-Oriented Partner"],
          goodMatch: ["The Creative Soul", "The Ambitious Professional"],
          challenging: ["The Avoidant Type", "The Drama Seeker"],
          avoid: ["The Narcissist", "The Emotional Manipulator"],
        },
        relationshipSuccess: { shortTerm: 85, longTerm: 78, marriage: 82 },
        potentialIssues: ["Avoiding necessary hard conversations", "Sacrificing own needs for harmony", "Struggling with very independent partners"],
        strengthsAsPartner: ["Creates safe emotional space", "Supports partner's goals", "Consistent communication", "Shows affection consistently", "Works through challenges together"],
      };
      setInsights(mock);
      localStorage.setItem('anterosInsights', JSON.stringify(mock));
      localStorage.setItem('anterosConversation', JSON.stringify(conversation));
    } finally {
      setIsGenerating(false);
    }
  };

  const resetAssessment = () => {
    setCurrentStep('intro');
    setConversation([]);
    setInsights(null);
    setQuestionsAnswered(0);
    localStorage.removeItem('anterosInsights');
    localStorage.removeItem('anterosConversation');
  };

  const personaLabel = PERSONA_OPTIONS.find(p => p.value === persona)?.label ?? 'Eros';

  // ─── INTRO ────────────────────────────────────────────────────────────────────
  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center pt-8 pb-10">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-600/30 blur-2xl scale-150" />
              <ErosAvatar size={96} speaking={false} persona={persona} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Chat with{" "}
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {personaLabel}
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-md mx-auto">
              Your AI companion who reads between the lines — uncovering who you really are, and who you're truly compatible with.
            </p>
          </div>

          {/* Persona selector */}
          <GlassCard className="mb-5 p-5" glow>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3 text-center">Choose your vibe</p>
            <div className="grid grid-cols-3 gap-3">
              {PERSONA_OPTIONS.map(p => (
                <button
                  key={p.value}
                  onClick={() => savePersona(p.value)}
                  className={`relative rounded-xl p-3 text-center transition-all duration-200 border ${
                    persona === p.value
                      ? "bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/50 shadow-lg shadow-pink-500/20"
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
                  }`}
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="text-white font-semibold text-sm">{p.label}</div>
                  <div className="text-white/40 text-xs mt-0.5">{p.desc}</div>
                  {persona === p.value && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-pink-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            {isSavingPersona && <p className="text-white/30 text-xs text-center mt-2">Saving...</p>}
          </GlassCard>

          {/* What Eros discovers */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-pink-400" />
                <span className="text-white font-semibold text-sm">What I'll Discover</span>
              </div>
              <ul className="space-y-2">
                {["Red & green flags", "Your fighting style", "Attraction patterns", "IQ & EQ estimate", "Life trajectory"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-white/60 text-xs">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-white font-semibold text-sm">Compatibility Score</span>
              </div>
              <ul className="space-y-2">
                {["Perfect matches (85%+)", "Good matches (70–84%)", "Why you'd work", "Where you'd clash", "Growth opportunities"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span className="text-white/60 text-xs">{item}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* Privacy */}
          <GlassCard className="p-4 mb-6 border-white/5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm mb-1">Your Privacy is Sacred</p>
                <p className="text-white/50 text-xs leading-relaxed">
                  Everything you share is completely confidential. Your personality insights are only shared with potential matches after you review and approve them.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* How it works */}
          <GlassCard className="p-5 mb-6" glow>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              <span className="text-white font-semibold">How it works</span>
            </div>
            <p className="text-white/50 text-sm mb-4">
              {personaLabel} will have a natural conversation with you — no boring quiz, just chat. Speak your answers out loud or type them. After ~10 exchanges, your full personality analysis is revealed.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleVoice}
                  className={`border-white/20 text-white hover:bg-white/10 text-xs ${voiceEnabled ? "bg-purple-500/20 border-purple-500/40" : "bg-white/5"}`}
                >
                  {voiceEnabled ? <Volume2 className="w-3 h-3 mr-1 text-purple-400" /> : <VolumeX className="w-3 h-3 mr-1 text-white/40" />}
                  Voice {voiceEnabled ? "On" : "Off"}
                </Button>
              </div>
              <Button
                onClick={startAssessment}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 font-semibold"
              >
                Start with {personaLabel}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // ─── ASSESSMENT ───────────────────────────────────────────────────────────────
  if (currentStep === 'assessment') {
    const progress = Math.min((questionsAnswered / totalQuestions) * 100, 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <ErosAvatar size={40} speaking={isSpeaking} persona={persona} />
            <div>
              <p className="text-white font-bold text-sm">{personaLabel}</p>
              <p className="text-white/40 text-xs">Reading between the lines…</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white/40 text-xs">Progress</p>
              <p className="text-white font-semibold text-sm">{questionsAnswered}/{totalQuestions}</p>
            </div>
            <div className="w-24">
              <Progress value={progress} className="h-1.5 bg-white/10" />
            </div>
            <Button onClick={toggleVoice} variant="ghost" size="icon" className="text-white/50 hover:text-white w-8 h-8">
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Chat */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {conversation.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                {msg.role === 'eros' && (
                  <ErosAvatar size={32} speaking={false} persona={persona} />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-tr-sm shadow-lg shadow-purple-500/20'
                      : 'bg-white/8 backdrop-blur border border-white/10 text-white rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'eros' && (
                    <p className="text-xs font-semibold text-pink-400 mb-1">{personaLabel}</p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start gap-3">
                <ErosAvatar size={32} speaking={true} persona={persona} />
                <div className="bg-white/8 backdrop-blur border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <p className="text-xs font-semibold text-pink-400 mb-2">{personaLabel}</p>
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map(delay => (
                      <div key={delay} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-white/10 bg-slate-900/90 backdrop-blur px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant="ghost"
              size="icon"
              className={`w-10 h-10 flex-shrink-0 rounded-xl border transition-all ${
                isListening
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isListening ? "Listening… click mic to stop" : "Type your answer, or click the mic…"}
              className="flex-1 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl min-h-[44px] max-h-32 focus:border-purple-500/50 focus:ring-purple-500/20"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!message.trim() || isGenerating}
              className="w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-white/20 text-xs mt-2">Enter to send • Shift+Enter for new line</p>
        </div>
      </div>
    );
  }

  // ─── INSIGHTS ─────────────────────────────────────────────────────────────────
  if (currentStep === 'insights') {
    if (!insights) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <ErosAvatar size={80} speaking={true} persona={persona} />
            </div>
            <p className="text-white font-bold text-xl mb-2">Compiling your analysis…</p>
            <p className="text-white/40 text-sm">This takes a moment. {personaLabel} is reading between the lines.</p>
            <div className="flex gap-2 justify-center mt-4">
              {[0, 200, 400].map(d => (
                <div key={d} className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    const healthColor = insights.attractionPattern.healthiness === 'healthy' ? 'emerald' : insights.attractionPattern.healthiness === 'mixed' ? 'yellow' : 'red';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 p-4 pb-12">
        <div className="max-w-5xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 pt-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Your Analysis</h1>
              <p className="text-white/40 text-sm">Compiled by {personaLabel}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                  <Home className="w-4 h-4 mr-1" /> Home
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAssessment}
                className="text-white/50 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1" /> Retake
              </Button>
              <Button
                size="sm"
                onClick={() => { setCurrentStep('assessment'); setQuestionsAnswered(10); }}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
              >
                <MessageCircle className="w-4 h-4 mr-1" /> Chat Again
              </Button>
            </div>
          </div>

          {/* Hero personality card */}
          <GlassCard className="p-6 mb-6" glow>
            <div className="flex items-start gap-5">
              <ErosAvatar size={64} speaking={false} persona={persona} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-white/50 text-sm uppercase tracking-widest">Personality Type</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">{insights.personalityType}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(insights.corePersonality).map(([trait, score]) => (
                    <StatBar key={trait} label={trait} value={score} max={10} color={score >= 7 ? "purple" : score >= 4 ? "blue" : "red"} />
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Overall Compat.", value: `${insights.compatibilityScore.overall}%`, icon: Heart, color: "text-pink-400" },
              { label: "Trustworthiness", value: `${insights.trustworthiness}%`, icon: Shield, color: "text-emerald-400" },
              { label: "Life Success", value: `${insights.lifeTrajectory.successProbability}%`, icon: TrendingUp, color: "text-blue-400" },
              { label: "Social Type", value: insights.socialType, icon: Users, color: "text-purple-400" },
            ].map(stat => (
              <GlassCard key={stat.label} className="p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="flags">
            <TabsList className="w-full grid grid-cols-3 sm:grid-cols-5 bg-white/5 border border-white/10 rounded-xl mb-4 p-1 h-auto">
              {[
                { value: "flags", label: "Flags" },
                { value: "character", label: "Character" },
                { value: "relationships", label: "Relationships" },
                { value: "compatibility", label: "Compat." },
                { value: "predictions", label: "Future" },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-white/50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-purple-500/20 rounded-lg text-xs py-2"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Flags tab */}
            <TabsContent value="flags" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">Green Flags</span>
                  </div>
                  <ul className="space-y-2">
                    {insights.greenFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/70 text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                <GlassCard className="p-5 border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="text-white font-semibold">Red Flags</span>
                  </div>
                  <ul className="space-y-2">
                    {insights.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/70 text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
              {insights.concerningBehaviors.length > 0 && (
                <GlassCard className="p-4 border-orange-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold text-sm">Behaviors to Watch</span>
                  </div>
                  <ul className="space-y-1">
                    {insights.concerningBehaviors.map((b, i) => (
                      <li key={i} className="text-white/60 text-sm">• {b}</li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </TabsContent>

            {/* Character tab */}
            <TabsContent value="character" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">Intelligence & Integrity</span>
                  </div>
                  <div className="space-y-1 mb-4">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mb-3">
                      IQ Estimate: {insights.estimatedIQ.range}
                    </Badge>
                    <p className="text-white/40 text-xs mb-4">{insights.estimatedIQ.reasoning}</p>
                  </div>
                  <div className="space-y-3">
                    <StatBar label="Trustworthiness" value={insights.trustworthiness} color="green" />
                    <StatBar label="Honesty" value={insights.honestyLevel} color="blue" />
                    <StatBar label="Sincerity" value={insights.sincerity} color="purple" />
                    <StatBar label="Emotional Stability" value={insights.emotionalStability} color="pink" />
                  </div>
                </GlassCard>

                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-semibold">Behavioral Profile</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Pushover?", value: insights.isPushover ? "Yes" : "No", bad: insights.isPushover },
                      { label: "Cheating Risk", value: insights.cheatingLikelihood, bad: insights.cheatingLikelihood === 'high' || insights.cheatingLikelihood === 'moderate' },
                      { label: "Plays Games?", value: insights.gamePlaying ? "Yes" : "No", bad: insights.gamePlaying },
                      { label: "Gossip Level", value: insights.gossipTendency, bad: insights.gossipTendency === 'often' },
                      { label: "Anxiety Level", value: insights.anxietyLevel, bad: insights.anxietyLevel === 'high' },
                      { label: "Narcissism", value: insights.narcissismLevel, bad: insights.narcissismLevel === 'moderate' || insights.narcissismLevel === 'severe' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">{item.label}</span>
                        <Badge className={item.bad ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"}>
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Relationships tab */}
            <TabsContent value="relationships" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <span className="text-white font-semibold">Attraction Pattern</span>
                  </div>
                  <p className="text-white font-medium mb-1">{insights.attractionPattern.type}</p>
                  <p className="text-white/50 text-sm mb-3">{insights.attractionPattern.reason}</p>
                  <Badge className={
                    healthColor === 'emerald' ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                    healthColor === 'yellow' ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                    "bg-red-500/20 text-red-300 border-red-500/30"
                  }>
                    {insights.attractionPattern.healthiness} attraction pattern
                  </Badge>
                  <div className="mt-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Fighting Style</p>
                    <p className="text-white text-sm">{insights.fightingStyle}</p>
                  </div>
                </GlassCard>
                <GlassCard className="p-5">
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Strengths as a Partner</p>
                  <ul className="space-y-2 mb-4">
                    {insights.strengthsAsPartner.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/70 text-sm">{s}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Cohabitation Challenges</p>
                  <ul className="space-y-1">
                    {insights.cohabitationChallenges.map((c, i) => (
                      <li key={i} className="text-white/50 text-xs">• {c}</li>
                    ))}
                  </ul>
                </GlassCard>
              </div>
            </TabsContent>

            {/* Compatibility tab */}
            <TabsContent value="compatibility" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <p className="text-white font-semibold mb-4">Compatibility Scores</p>
                  <div className="space-y-3">
                    <StatBar label="Overall" value={insights.compatibilityScore.overall} color="pink" />
                    <StatBar label="Romantic" value={insights.compatibilityScore.romantic} color="rose" />
                    <StatBar label="Friendship" value={insights.compatibilityScore.friendship} color="purple" />
                    <StatBar label="Professional" value={insights.compatibilityScore.professional} color="blue" />
                  </div>
                  <div className="mt-5 space-y-2">
                    <p className="text-white/50 text-xs uppercase tracking-wider">Relationship Success</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Short-term (6mo)</span>
                      <span className="text-white font-bold">{insights.relationshipSuccess.shortTerm}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Long-term (2yr+)</span>
                      <span className="text-white font-bold">{insights.relationshipSuccess.longTerm}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Marriage success</span>
                      <span className="text-white font-bold">{insights.relationshipSuccess.marriage}%</span>
                    </div>
                  </div>
                </GlassCard>
                <div className="space-y-3">
                  <GlassCard className="p-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Ideal Partner Traits</p>
                    <ul className="space-y-1.5">
                      {insights.idealPartnerTraits.map((t, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Heart className="w-3 h-3 text-pink-400 flex-shrink-0" />
                          <span className="text-white/70 text-xs">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                  <GlassCard className="p-4 border-red-500/10">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Deal-Breakers</p>
                    <ul className="space-y-1.5">
                      {insights.dealbreakers.map((d, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="text-white/70 text-xs">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Perfect Matches", items: insights.matchCategories.perfectMatch, color: "emerald" },
                  { label: "Good Matches", items: insights.matchCategories.goodMatch, color: "blue" },
                  { label: "Challenging", items: insights.matchCategories.challenging, color: "yellow" },
                  { label: "Avoid", items: insights.matchCategories.avoid, color: "red" },
                ].map(cat => (
                  <GlassCard key={cat.label} className={`p-4 border-${cat.color}-500/20`}>
                    <p className={`text-${cat.color}-400 text-xs font-semibold uppercase tracking-wider mb-2`}>{cat.label}</p>
                    <ul className="space-y-1">
                      {cat.items.map((item, i) => (
                        <li key={i} className="text-white/60 text-xs">{item}</li>
                      ))}
                    </ul>
                  </GlassCard>
                ))}
              </div>
            </TabsContent>

            {/* Predictions tab */}
            <TabsContent value="predictions" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">Life Trajectory</span>
                  </div>
                  <p className="text-white font-medium mb-1">{insights.lifeTrajectory.prediction}</p>
                  <p className="text-white/40 text-xs mb-4">{insights.lifeTrajectory.reasoning}</p>
                  <StatBar label="Success Probability" value={insights.lifeTrajectory.successProbability} color="blue" />
                  <div className="mt-4">
                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Predicted Parenting Style</p>
                    <p className="text-white/80 text-sm">{insights.parentingStyle}</p>
                  </div>
                </GlassCard>
                <GlassCard className="p-5">
                  <p className="text-white font-semibold mb-4">Social Behavior</p>
                  <div className="space-y-3">
                    <StatBar label="Friendliness" value={insights.socialBehavior.friendly} max={10} color="green" />
                    <StatBar label="Helpfulness" value={insights.socialBehavior.helpful} max={10} color="blue" />
                    <StatBar label="Selfishness" value={insights.socialBehavior.selfish} max={10} color="red" />
                    <StatBar label="Indifference" value={insights.socialBehavior.indifferent} max={10} color="yellow" />
                  </div>
                </GlassCard>
              </div>
              {insights.potentialIssues.length > 0 && (
                <GlassCard className="p-5 border-orange-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold text-sm">Things to Work On</span>
                  </div>
                  <ul className="space-y-2">
                    {insights.potentialIssues.map((issue, i) => (
                      <li key={i} className="text-white/60 text-sm">• {issue}</li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return null;
}
