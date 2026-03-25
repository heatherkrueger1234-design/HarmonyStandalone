import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Heart,
  Laugh,
  Volume2,
  CheckCircle2,
  Copy,
  Share2,
  ArrowLeft,
  Flame,
  RefreshCw,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface ToneOption {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  ring: string;
  description: string;
}

const TONES: ToneOption[] = [
  {
    id: "gentle",
    label: "Gentle",
    sublabel: "Warm & kind",
    icon: Heart,
    gradient: "from-rose-500/20 to-pink-500/20",
    ring: "ring-rose-500/50",
    description: "Softens your words while keeping the meaning intact",
  },
  {
    id: "sassy",
    label: "Sassy but Safe",
    sublabel: "Real talk",
    icon: Laugh,
    gradient: "from-pink-500/20 to-purple-500/20",
    ring: "ring-pink-500/50",
    description: "Keeps your personality while preventing a fight",
  },
  {
    id: "therapist",
    label: "Therapist Mode",
    sublabel: "Deep & mindful",
    icon: Volume2,
    gradient: "from-emerald-500/20 to-teal-500/20",
    ring: "ring-emerald-500/50",
    description: "Feelings-forward language that opens conversation",
  },
  {
    id: "funny",
    label: "Witty & Light",
    sublabel: "Laugh it off",
    icon: Sparkles,
    gradient: "from-amber-500/20 to-yellow-500/20",
    ring: "ring-amber-500/50",
    description: "Diffuses tension with a bit of humour",
  },
];

interface TranslationResult {
  translated: string;
  tip: string;
  tone: string;
  traitNote?: string;
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export default function BabelBridge() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [selectedTone, setSelectedTone] = useState("gentle");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<"helped" | "meh" | null>(null);
  const [streak, setStreak] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);

  const { data: userData } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const partnerName = userData?.partnerName || "your partner";
  const userName = userData?.firstName || userData?.name?.split(" ")[0] || "you";

  const activeTone = TONES.find((t) => t.id === selectedTone)!;

  const translate = async () => {
    if (!input.trim() || isTranslating) return;
    setIsTranslating(true);
    setResult(null);
    setFeedbackGiven(null);

    try {
      const res = await apiRequest("POST", "/api/babel-bridge/translate", {
        input: input.trim(),
        tone: selectedTone,
        partnerName,
      });
      const data = await res.json();
      if (data.translated) {
        setResult({ ...data, tone: selectedTone });
        setStreak((s) => s + 1);
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        throw new Error("No translation returned");
      }
    } catch (error) {
      console.error("BabelBridge translation error:", error);
      setResult({
        translated: input.trim(),
        tip: "Translation unavailable right now — try again in a moment. Here is your original text.",
        tone: selectedTone
      });
      toast({
        title: "Translation unavailable",
        description: "Showing original text while we wait for BabelBridge to warm up.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.translated);
      toast({ title: "Copied!", description: "Paste it and hit send." });
    } catch {
      toast({ title: "Copy failed", description: "Select and copy manually.", variant: "destructive" });
    }
  };

  const shareTranslation = async () => {
    if (!result) return;
    const shareText = `What I wanted to say:\n"${input}"\n\nWhat actually goes out (via BabelBridge):\n"${result.translated}"\n\n— Made with SyncWithInsight`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BabelBridge saved my text!", text: shareText });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard!", description: "Share it wherever you like." });
    }
  };

  const giveFeedback = async (helped: boolean) => {
    setFeedbackGiven(helped ? "helped" : "meh");
    toast({
      title: helped ? "Streak protected! 🔥" : "Noted — we'll do better 💪",
      description: helped
        ? "Glad BabelBridge helped. Keep communicating!"
        : "Your feedback helps the AI improve.",
    });
    // Best-effort feedback tracking
    try {
      await apiRequest("POST", "/api/babel-bridge/feedback", {
        tone: selectedTone,
        helped,
        inputLength: input.length,
      });
    } catch {
      // silent
    }
  };

  const reset = () => {
    setInput("");
    setResult(null);
    setFeedbackGiven(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950/30 to-slate-900 p-4 pb-16">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between pt-6 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/harmony-hub">
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white w-8 h-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                BabelBridge
              </h1>
              <p className="text-white/40 text-xs">Translate before you send</p>
            </div>
          </div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 rounded-full"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-300 text-xs font-semibold">Streak: {streak}</span>
            </motion.div>
          )}
        </div>

        {/* Subtitle */}
        <GlassCard className="p-4 mb-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/60 text-sm leading-relaxed">
              Type what you're <em className="text-white/80">really</em> thinking — no filter needed here.
              Pick a tone and BabelBridge rewrites it in a way {partnerName} can actually hear.
            </p>
          </div>
        </GlassCard>

        {/* Tone Selector */}
        <div className="mb-5">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Choose your tone</p>
          <div className="grid grid-cols-2 gap-2.5">
            {TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={`relative p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedTone === tone.id
                    ? `bg-gradient-to-br ${tone.gradient} border-transparent ring-2 ${tone.ring}`
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <tone.icon className={`w-5 h-5 mb-1.5 ${selectedTone === tone.id ? "text-white" : "text-white/50"}`} />
                <div className={`font-semibold text-sm ${selectedTone === tone.id ? "text-white" : "text-white/70"}`}>
                  {tone.label}
                </div>
                <div className={`text-xs mt-0.5 ${selectedTone === tone.id ? "text-white/70" : "text-white/30"}`}>
                  {tone.sublabel}
                </div>
                {selectedTone === tone.id && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={selectedTone}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-xs mt-2 text-center"
            >
              {activeTone.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="mb-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type what you're really thinking about ${partnerName}... (no filter needed here)`}
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/25 rounded-xl min-h-[140px] focus:border-indigo-500/50 focus:ring-indigo-500/10 resize-none text-base leading-relaxed"
            rows={5}
          />
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-white/25 text-xs">{input.length} chars</span>
            {input.length > 0 && (
              <button onClick={() => setInput("")} className="text-white/25 text-xs hover:text-white/50 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Translate Button */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={translate}
            disabled={!input.trim() || isTranslating}
            className="w-full py-6 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-2xl shadow-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <span className="flex items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Translating for peace…
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <Send className="w-5 h-5" />
                Translate Before I Send
              </span>
            )}
          </Button>
        </motion.div>

        {/* Output */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={outputRef}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="mt-8"
            >
              {/* Card */}
              <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/10">

                {/* Card header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">BabelBridge Translation</p>
                      <p className="text-white/70 text-xs mt-0.5">
                        Tone: {TONES.find((t) => t.id === result.tone)?.label}
                        {result.traitNote && <> · {result.traitNote}</>}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-white/80" />
                  </div>
                </div>

                {/* Before */}
                <div className="px-5 pt-5 pb-4">
                  <p className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-2">
                    What you wanted to say
                  </p>
                  <p className="text-white/60 italic text-sm leading-relaxed">"{input}"</p>
                </div>

                <div className="mx-5 border-t border-white/8" />

                {/* After */}
                <div className="px-5 pt-4 pb-5">
                  <p className="text-indigo-400 text-xs uppercase tracking-widest font-bold mb-2">
                    What actually goes out
                  </p>
                  <p className="text-white text-base leading-relaxed font-medium">"{result.translated}"</p>
                </div>

                {/* Tip */}
                {result.tip && (
                  <>
                    <div className="mx-5 border-t border-white/8" />
                    <div className="px-5 py-3.5 bg-indigo-500/8">
                      <p className="text-indigo-300 text-xs font-semibold mb-0.5">💡 Eros tip</p>
                      <p className="text-white/60 text-xs leading-relaxed">{result.tip}</p>
                    </div>
                  </>
                )}

                {/* Actions row */}
                <div className="border-t border-white/8 px-5 py-3.5 flex items-center justify-between bg-white/3">
                  {/* Feedback */}
                  {feedbackGiven === null ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => giveFeedback(true)}
                        className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                      >
                        <Heart className="w-4 h-4" /> Helped!
                      </button>
                      <button
                        onClick={() => giveFeedback(false)}
                        className="text-white/30 hover:text-white/60 text-sm transition-colors"
                      >
                        Meh
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      {feedbackGiven === "helped" ? "Glad it helped!" : "Noted — improving!"}
                    </div>
                  )}

                  {/* Share / Copy */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="text-white/50 hover:text-white h-8 px-2"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Copy</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={shareTranslation}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 rounded-lg"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Share</span>
                    </Button>
                  </div>
                </div>

                {/* Watermark */}
                <p className="text-center text-white/15 text-[10px] pb-3 italic">
                  Made with SyncWithInsight · BabelBridge
                </p>
              </div>

              {/* Translate again */}
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={reset}
                  variant="ghost"
                  className="flex-1 border border-white/10 text-white/50 hover:text-white hover:border-white/20 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New message
                </Button>
                <Button
                  onClick={() => { setResult(null); setFeedbackGiven(null); }}
                  className="flex-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 hover:from-indigo-500/30 hover:to-purple-500/30 rounded-xl"
                >
                  Try different tone
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Examples hint */}
              <div className="mt-6">
                <p className="text-white/25 text-xs text-center mb-3">Try saying…</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Why do you always leave your socks on the floor?",
                    "I feel invisible when you're on your phone.",
                    "We never do anything fun together anymore.",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => { setInput(example); setResult(null); }}
                      className="text-left p-3 bg-white/3 border border-white/8 rounded-xl text-white/40 text-xs hover:bg-white/6 hover:text-white/60 hover:border-white/15 transition-all"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example prompts (shown when no result) */}
        {!result && !isTranslating && (
          <div className="mt-8">
            <p className="text-white/25 text-xs text-center mb-3">Or start with one of these…</p>
            <div className="grid gap-2">
              {[
                "Why do you always leave your socks on the floor?",
                "I feel invisible when you're on your phone all night.",
                "We never do anything fun together anymore.",
                "I need some alone time but I don't want to hurt your feelings.",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="text-left p-3 bg-white/3 border border-white/8 rounded-xl text-white/40 text-xs hover:bg-white/6 hover:text-white/60 hover:border-white/15 transition-all"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
