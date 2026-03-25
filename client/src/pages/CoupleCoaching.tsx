// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🔒 LOCKED — DO NOT MODIFY WITHOUT EXPLICIT APPROVAL                 ║
// ║  Status: VERIFIED WORKING ✅  (confirmed 2026-03-08)                 ║
// ║  Feature: Couple Coaching — private message toggle (lock icon)       ║
// ╚══════════════════════════════════════════════════════════════════════╝
import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCoupleSession } from "@/hooks/useCoupleSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Heart, CheckCircle2, Clock, AlertTriangle, Wifi, WifiOff,
  BookOpen, ChevronDown, ChevronUp, Sparkles, Users, Circle, Lock, Eye
} from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

interface SessionData {
  sessionId: string;
  messages: any[];
  homework: any[];
  problems: any[];
  sessionSummary?: string;
  partner?: { id: string; name: string; profileImage?: string };
  sessionNumber: number;
}

export default function CoupleCoaching() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [privateMode, setPrivateMode] = useState(false);
  const [showHW, setShowHW] = useState(true);
  const [showProblems, setShowProblems] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, homework, partnerTyping, partnerOnline, sendTyping,
          isConnected, appendMessages, setHomework, receivedGift, clearReceivedGift } = useCoupleSession();

  useEffect(() => {
    if (receivedGift) {
      toast({
        title: `${receivedGift.emoji} ${receivedGift.senderName} sent you a ${receivedGift.label}!`,
        description: receivedGift.message ? `"${receivedGift.message}"` : "A little love just for you 💜",
      });
      clearReceivedGift();
    }
  }, [receivedGift, clearReceivedGift, toast]);

  const { data: session, isLoading } = useQuery<SessionData>({
    queryKey: ["/api/coaching/couple-session"],
    staleTime: 30000,
  });

  useEffect(() => {
    if (session) {
      appendMessages(session.messages.map((m: any) => ({
        id: m.id || `${m.role}_${m.timestamp}`,
        role: m.role as any,
        content: m.content,
        senderName: m.senderName,
        timestamp: m.timestamp,
      })));
      setHomework(session.homework);
    }
  }, [session, appendMessages, setHomework]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const chatMutation = useMutation({
    mutationFn: async ({ content, isPrivate }: { content: string; isPrivate: boolean }) => {
      const res = await apiRequest("POST", "/api/coaching/couple-chat", {
        message: content,
        sessionId: session?.sessionId,
        isPrivate,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      appendMessages([...messages, data.userMessage, data.aiMessage]);
      setHomework(data.homework);
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/couple-session"] });
    },
    onError: () => {
      toast({ title: "Could not send message", description: "Please try again.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (index: number) => {
      const res = await apiRequest("POST", `/api/coaching/homework/${index}/complete`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      setHomework(data.homework);
      toast({ title: "Homework completed!", description: "Great work — your coach has been notified." });
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    setInput("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (session?.partner?.id) sendTyping(session.sessionId, false, session.partner.id);
    chatMutation.mutate({ content: text, isPrivate: privateMode });
    if (privateMode) setPrivateMode(false);
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!session?.partner?.id) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    sendTyping(session.sessionId, true, session.partner.id);
    typingTimerRef.current = setTimeout(() => {
      sendTyping(session?.sessionId || "", false, session?.partner?.id);
    }, 2000);
  };

  const getSenderColor = (role: string, senderId?: string) => {
    if (role === "assistant") return "from-violet-600/20 to-purple-600/20 border-violet-500/30";
    if (role === "partner") return "from-rose-600/20 to-pink-600/20 border-rose-500/30";
    return "from-slate-600/20 to-slate-700/20 border-white/10";
  };

  const getSenderName = (msg: any) => {
    if (msg.role === "assistant") return "Harmony";
    if (msg.role === "partner") return session?.partner?.name || "Partner";
    return user?.fullName || user?.displayName || "You";
  };

  const pendingHW = homework.filter(h => h.status === "pending");
  const completedHW = homework.filter(h => h.status === "completed");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-white/60">Loading your coaching session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex flex-col pt-16">
      <div className="flex flex-1 max-w-6xl mx-auto w-full gap-0">

        {/* MAIN CHAT */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="sticky top-16 z-10 bg-slate-900/95 backdrop-blur border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/harmony-hub")} className="text-white/50 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Harmony Coaching</p>
                    <p className="text-white/40 text-xs">Session {session?.sessionNumber || 1} · Private & Safe</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session?.partner && (
                  <div className="flex items-center gap-1.5 bg-white/[0.04] rounded-full px-2.5 py-1">
                    <Circle className={`w-2 h-2 fill-current ${partnerOnline ? "text-green-400" : "text-white/20"}`} />
                    <span className="text-xs text-white/60">{session.partner.name}</span>
                  </div>
                )}
                <div title={isConnected ? "Live" : "Reconnecting..."}>
                  {isConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-white/30 animate-pulse" />}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-white/80 font-semibold text-lg">Welcome to Harmony Coaching</p>
                <p className="text-white/50 text-sm max-w-sm mx-auto">
                  This is your shared couples coaching space — both you and your partner can see messages here. Use the <Lock className="w-3 h-3 inline mx-0.5 text-amber-400" /> lock button to send a private note only the AI sees.
                </p>
                {session?.partner ? (
                  <div className="flex items-center gap-2 justify-center bg-white/[0.04] rounded-full px-4 py-2 w-fit mx-auto">
                    <Users className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-white/60">Coaching with <span className="text-violet-300 font-medium">{session.partner.name}</span></span>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 max-w-sm mx-auto">
                    <p className="text-amber-300 text-sm">Invite your partner from the Harmony Hub to coach together.</p>
                  </div>
                )}
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const isAI = msg.role === "assistant";
                return (
                  <motion.div key={msg.id || i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold
                      ${isAI ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white" :
                        msg.role === "partner" ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white" :
                        "bg-gradient-to-br from-slate-500 to-slate-600 text-white"}`}>
                      {isAI ? "H" : (getSenderName(msg).charAt(0).toUpperCase())}
                    </div>
                    <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <span className="text-[10px] text-white/30 px-1">{getSenderName(msg)}</span>
                      <div className={`rounded-2xl px-4 py-3 text-sm bg-gradient-to-br border text-white/90 leading-relaxed ${msg.isPrivate ? "border-amber-400/30 bg-amber-500/10 from-amber-500/10 to-orange-500/5" : getSenderColor(msg.role)}`}>
                        {msg.isPrivate && (
                          <div className="flex items-center gap-1 mb-1">
                            <Lock className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[9px] text-amber-400 font-medium uppercase tracking-wide">Private — only you & AI see this</span>
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            {partnerTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-[11px] font-bold text-white">
                  {(session?.partner?.name || "P").charAt(0)}
                </div>
                <div className="bg-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}

            {chatMutation.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white">H</div>
                <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-2xl px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-white/[0.06] px-4 py-3">
            {privateMode && (
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-300 font-medium">Private mode — this message goes only to the AI, not your partner</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPrivateMode(v => !v)}
                title={privateMode ? "Private mode on — click to turn off" : "Send privately to AI only (partner won't see this)"}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  privateMode
                    ? "bg-amber-500/20 border-amber-400/50 text-amber-400"
                    : "bg-white/[0.04] border-white/10 text-white/30 hover:text-white/60 hover:border-white/20"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <Input
                ref={inputRef}
                value={input}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={privateMode ? "Private note to AI only..." : "Share what's on your mind..."}
                className={`bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 rounded-xl flex-1 ${privateMode ? "border-amber-400/30 bg-amber-500/5" : ""}`}
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                className={`text-white rounded-xl px-4 disabled:opacity-50 transition-all ${
                  privateMode
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                    : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                }`}
              >
                {privateMode ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2">
              Couple coaching is shared with your partner. Use the <Lock className="w-2.5 h-2.5 inline mx-0.5" /> lock to send a private note only the AI sees.
            </p>
          </div>
        </div>

        {/* SIDEBAR — Homework + Issues */}
        <div className="hidden lg:flex flex-col w-80 border-l border-white/[0.06] bg-slate-900/60">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">

            {/* Homework */}
            <div>
              <button onClick={() => setShowHW(v => !v)}
                className="w-full flex items-center justify-between py-2 text-white/80 hover:text-white transition-colors">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  <span className="font-semibold text-sm">Homework</span>
                  {pendingHW.length > 0 && (
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px] px-1.5">
                      {pendingHW.length}
                    </Badge>
                  )}
                </div>
                {showHW ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
              </button>

              <AnimatePresence>
                {showHW && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 mt-1">
                    {homework.length === 0 ? (
                      <p className="text-white/30 text-xs text-center py-4">Homework will appear here as your coach assigns it during your sessions.</p>
                    ) : (
                      homework.map((hw, i) => (
                        <div key={i} className={`rounded-xl p-3 border transition-all ${
                          hw.status === "completed"
                            ? "bg-green-500/10 border-green-500/20 opacity-60"
                            : "bg-white/[0.04] border-white/[0.08]"
                        }`}>
                          <div className="flex items-start gap-2">
                            <button
                              onClick={() => hw.status === "pending" && completeMutation.mutate(i)}
                              disabled={hw.status !== "pending" || completeMutation.isPending}
                              className="mt-0.5 flex-shrink-0 transition-colors"
                            >
                              <CheckCircle2 className={`w-4 h-4 ${
                                hw.status === "completed" ? "text-green-400" : "text-white/20 hover:text-violet-400"
                              }`} />
                            </button>
                            <div className="min-w-0">
                              <p className={`text-xs leading-relaxed ${hw.status === "completed" ? "line-through text-white/40" : "text-white/80"}`}>
                                {hw.task}
                              </p>
                              {hw.status === "pending" && (
                                <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Pending
                                </p>
                              )}
                              {hw.status === "completed" && (
                                <p className="text-[10px] text-green-400/60 mt-1">Completed!</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Known Issues */}
            {session?.problems && session.problems.length > 0 && (
              <div>
                <button onClick={() => setShowProblems(v => !v)}
                  className="w-full flex items-center justify-between py-2 text-white/80 hover:text-white transition-colors">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-sm">Focus Areas</span>
                  </div>
                  {showProblems ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                </button>
                <AnimatePresence>
                  {showProblems && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 mt-1">
                      {session.problems.filter((p: any) => p.status !== "resolved").map((p: any, i: number) => (
                        <div key={i} className={`rounded-xl px-3 py-2 border text-xs ${
                          p.severity === "high" ? "bg-red-500/10 border-red-500/20 text-red-300" :
                          p.severity === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                          "bg-slate-500/10 border-white/10 text-white/60"
                        }`}>
                          {p.description}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Session memory */}
            {session?.sessionSummary && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2">Session Memory</p>
                <p className="text-xs text-white/50 leading-relaxed">{session.sessionSummary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
