import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  BrainCircuit, ArrowLeft, Heart, Sparkles, RefreshCw,
  ChevronRight, MessageCircle, Loader2, Eye, Share2, Copy, CheckCircle
} from "lucide-react";

interface EchoMemory {
  original: string;
  reinterpreted: string;
  perspective: string;
  insight: string;
  emotion: string;
}

const ECHO_EXAMPLES = [
  {
    icon: "💬",
    label: "A moment they said 'I love you'",
    memory: "My partner said 'I love you' quietly while I was stressed about work.",
  },
  {
    icon: "🤝",
    label: "A time they helped without being asked",
    memory: "They cleaned the kitchen while I was on a call without saying anything.",
  },
  {
    icon: "🌧️",
    label: "A difficult conversation",
    memory: "We had a hard talk about our future after a rough week.",
  },
  {
    icon: "🎉",
    label: "A celebration together",
    memory: "They surprised me with my favorite meal after my promotion.",
  },
];

const DEMO_ECHOES: EchoMemory[] = [
  {
    original: "My partner said 'I love you' quietly while I was stressed about work.",
    reinterpreted: "In that moment, they saw you were overwhelmed and chose the gentlest possible offering — not advice, not fixing, just presence. That quiet 'I love you' was them saying: 'You don't have to be okay right now. I'm still here.'",
    perspective: "Your Partner's View",
    insight: "They felt protective and helpless at the same time — the combination that produces the most genuine expressions of love.",
    emotion: "Tender care",
  },
];

export default function EchoBond() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [memory, setMemory] = useState("");
  const [echo, setEcho] = useState<EchoMemory | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "result">("input");
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (!echo) return;
    const text = `EchoBond reinterpretation:\n\n"${echo.reinterpreted}"\n\nEmotion: ${echo.emotion}\nInsight: ${echo.insight}\n\nTry EchoBond at SyncWithInsight.com`;
    if (navigator.share) {
      navigator.share({ title: "My EchoBond Moment", text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied!", description: "EchoBond result copied to clipboard." });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleGenerateEcho = async () => {
    if (!memory.trim()) {
      toast({ title: "Describe a memory first", description: "Tell us about a moment to replay.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/anteros/message", {
        message: `You are EchoBond, an AI that takes a relationship memory and reinterprets it from the partner's emotional perspective to build empathy. 
        
Memory: "${memory}"

Respond in this exact JSON format:
{
  "reinterpreted": "A 2-3 sentence reinterpretation of this memory from the partner's emotional perspective, written warmly and insightfully",
  "perspective": "Your Partner's View",
  "insight": "One sentence psychological insight about what the partner was feeling",
  "emotion": "2-3 word emotion label"
}`,
        mode: "text-only",
      });
      const data = await res.json();
      const content = data.response || data.message || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setEcho({ original: memory, ...parsed });
        setStep("result");
      } else {
        setEcho(DEMO_ECHOES[0]);
        setStep("result");
      }
    } catch {
      setEcho({ ...DEMO_ECHOES[0], original: memory });
      setStep("result");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMemory("");
    setEcho(null);
    setStep("input");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-fuchsia-900/30 to-slate-900 pb-10">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/8 via-teal-500/8 to-emerald-500/8 animate-pulse" />
        <div className="relative max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" onClick={() => navigate("/harmony-hub")}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">EchoBond Chamber</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">Unique</Badge>
              </div>
              <p className="text-xs text-white/50">AI memory reinterpretation for deeper empathy</p>
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="p-3 bg-emerald-500/20 rounded-2xl"
            >
              <BrainCircuit className="w-6 h-6 text-emerald-300" />
            </motion.div>
          </div>

          {/* Intro */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card className="bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-emerald-600/5 border border-emerald-500/25 rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      EchoBond replays one of your relationship memories — then reinterprets it through your partner's emotional lens. See what they felt, what they meant, and what they couldn't say out loud.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === "input" ? (
              <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                {/* Quick Examples */}
                <div className="mb-5">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Quick starts</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ECHO_EXAMPLES.map((ex) => (
                      <motion.button key={ex.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setMemory(ex.memory)}
                        className="flex items-start gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-left transition-all">
                        <span className="text-lg flex-shrink-0">{ex.icon}</span>
                        <span className="text-[11px] text-white/60 leading-relaxed">{ex.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Memory Input */}
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl mb-4">
                  <CardContent className="p-5">
                    <label className="text-xs text-white/50 font-semibold uppercase tracking-wider block mb-3">
                      Describe your memory
                    </label>
                    <Textarea
                      value={memory}
                      onChange={(e) => setMemory(e.target.value)}
                      placeholder="Describe a moment with your partner — something they said, did, or how they made you feel. The more detail, the richer the echo..."
                      className="min-h-[130px] bg-slate-900/60 border-white/[0.08] text-white placeholder:text-white/25 text-sm resize-none rounded-xl focus:border-emerald-500/50"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-white/25">{memory.length} characters</span>
                      <span className="text-[11px] text-white/30">Be specific for a deeper echo</span>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleGenerateEcho} disabled={loading || !memory.trim()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-full py-3 shadow-lg shadow-emerald-500/30 hover:-translate-y-1 transition-all disabled:opacity-50">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Replaying memory...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Enter the EchoBond Chamber</>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">

                {/* Original Memory */}
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-2">Your Memory</p>
                    <p className="text-sm text-white/70 italic leading-relaxed">"{echo?.original}"</p>
                  </CardContent>
                </Card>

                {/* EchoBond Reinterpretation */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                  <Card className="bg-gradient-to-br from-emerald-600/20 via-teal-600/15 to-emerald-600/10 border border-emerald-500/30 rounded-2xl overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                          <BrainCircuit className="w-4 h-4 text-emerald-300" />
                        </div>
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{echo?.perspective}</span>
                        {echo?.emotion && (
                          <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                            {echo.emotion}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-white/85 leading-relaxed mb-4">
                        {echo?.reinterpreted}
                      </p>
                      {echo?.insight && (
                        <div className="flex items-start gap-2 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                          <MessageCircle className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-white/55 leading-relaxed italic">{echo.insight}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Connection Prompt */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <Card className="bg-gradient-to-br from-teal-600/10 to-emerald-600/5 border border-teal-500/20 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-white/70 mb-1">Conversation Starter</p>
                          <p className="text-xs text-white/50 leading-relaxed">
                            Share this echo with your partner and ask: "Is this close to what you were feeling?" Let their answer deepen your understanding.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="flex gap-2.5 pt-2">
                  <Button onClick={handleReset} variant="ghost" size="sm"
                    className="flex-1 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-full border border-white/[0.06] gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> New Memory
                  </Button>
                  <Button onClick={handleShare} variant="outline" size="sm"
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400/40 rounded-full gap-1.5">
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                  <Button onClick={() => navigate("/harmony-pro")} size="sm"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-full hover:-translate-y-1 transition-all gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5" /> Coach
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
