import { CrisisBanner } from '@/components/CrisisBanner';
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Heart, ArrowLeft, MessageCircle, Shield, Brain, Send,
  CheckCircle, Circle, ClipboardList, AlertTriangle, Sparkles, BookOpen
} from "lucide-react";

interface AffiliateSuggestion {
  partner: string;
  label: string;
  url: string;
}

interface CoachingMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  affiliateSuggestion?: AffiliateSuggestion;
}

interface HomeworkItem {
  task: string;
  assignedAt: string;
  completedAt?: string;
  status: 'pending' | 'completed' | 'skipped';
  notes?: string;
}

interface ProblemItem {
  description: string;
  severity: 'low' | 'medium' | 'high';
  identifiedAt: string;
  resolvedAt?: string;
  status: 'active' | 'improving' | 'resolved';
}

interface CoachingSession {
  id: string;
  sessionNumber: number;
  messages: CoachingMessage[];
  homework: HomeworkItem[];
  problems: ProblemItem[];
  sessionSummary: string | null;
  lastActiveAt: string;
}

export default function RelationshipCoach() {
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'homework' | 'problems'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ session: CoachingSession | null }>({
    queryKey: ['/api/coaching/session'],
  });
  const session = sessionData?.session;

  const { data: partnerStatus } = useQuery<{
    inviteCode: string | null;
    linkedPartnerId: string | null;
    partner: { id: string; name: string; hasCompletedAssessment: boolean } | null;
  }>({
    queryKey: ['/api/partner-invite/status'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/coaching/chat", { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/session'] });
    },
    onError: () => {
      toast({
        title: "Couldn't send message",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeHomeworkMutation = useMutation({
    mutationFn: async (index: number) => {
      const response = await apiRequest("POST", `/api/coaching/homework/${index}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaching/session'] });
      toast({ title: "Homework completed!", description: "Great job working on your relationship!" });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input.trim());
    setInput("");
  };

  const messages = session?.messages || [];
  const homework = session?.homework || [];
  const problems = session?.problems || [];
  const pendingHomework = homework.filter(h => h.status === 'pending');
  const activeProblems = problems.filter(p => p.status === 'active' || p.status === 'improving');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900/30 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/harmony-hub')}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Harmony Hub
          </Button>
          {partnerStatus?.partner && (
            <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
              <Heart className="w-3 h-3 mr-1" />
              Linked with {partnerStatus.partner.name}
            </Badge>
          )}
        </div>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-rose-500 flex items-center justify-center shadow-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-400 bg-clip-text text-transparent">
            AI Relationship Coach
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {session ? `Session #${session.sessionNumber}` : 'Loading...'} 
            {pendingHomework.length > 0 && ` · ${pendingHomework.length} homework pending`}
            {activeProblems.length > 0 && ` · ${activeProblems.length} active issues`}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {[
            { id: 'chat' as const, label: 'Chat', icon: MessageCircle, count: messages.length },
            { id: 'homework' as const, label: 'Homework', icon: ClipboardList, count: pendingHomework.length },
            { id: 'problems' as const, label: 'Issues', icon: AlertTriangle, count: activeProblems.length },
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id
                ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/10"
              }
              size="sm"
            >
              <tab.icon className="w-4 h-4 mr-1" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{tab.count}</span>
              )}
            </Button>
          ))}
        </div>

        {activeTab === 'chat' && (
          <Card className="border border-emerald-500/30 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-4">
              <div className="h-[500px] overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 && !sessionLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                    <Sparkles className="w-12 h-12 text-emerald-400/50" />
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-300">Welcome to your Relationship Coach</p>
                      <p className="text-sm mt-2 max-w-md">
                        I know both of your personality profiles and I'll remember everything we discuss. 
                        Tell me what's on your mind, what you're struggling with, or where you want to grow as a couple.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white'
                        : 'bg-white/10 text-gray-200 border border-white/5'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      
                      {msg.affiliateSuggestion && (
                        <div className="mt-3 p-3 rounded-xl bg-teal-900/40 border border-teal-500/30 group/affiliate">
                          <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Harmony suggests:
                          </p>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-teal-100 hover:text-teal-50 text-sm font-semibold flex items-center justify-between w-full"
                            onClick={async () => {
                              try {
                                await apiRequest("POST", "/api/affiliate/track-click", {
                                  partner: msg.affiliateSuggestion!.partner,
                                  context: 'harmony_coaching_chat'
                                });
                              } catch (e) {}
                              window.open(msg.affiliateSuggestion!.url, "_blank");
                            }}
                          >
                            <span>{msg.affiliateSuggestion.label}</span>
                            <ArrowLeft className="w-4 h-4 rotate-180 group-hover/affiliate:translate-x-1 transition-transform" />
                          </Button>
                          <p className="text-[9px] text-teal-500/50 mt-1">Sponsored</p>
                        </div>
                      )}

                      <p className="text-[10px] mt-1 opacity-50">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 p-3 rounded-2xl border border-white/5">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Tell your coach what's going on..."
                  className="bg-white/5 border-emerald-500/20 text-white placeholder:text-gray-500 resize-none"
                  rows={2}
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !input.trim()}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 h-auto"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'homework' && (
          <Card className="border border-emerald-500/30 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                Your Homework
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {homework.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No homework assigned yet</p>
                  <p className="text-sm mt-1">Start chatting with your coach and they'll assign tasks to help your relationship grow</p>
                </div>
              ) : (
                homework.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${
                    item.status === 'completed' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/5 border-emerald-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => item.status !== 'completed' && completeHomeworkMutation.mutate(idx)}
                        className="mt-0.5 flex-shrink-0"
                        disabled={item.status === 'completed'}
                      >
                        {item.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-500 hover:text-emerald-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${item.status === 'completed' ? 'text-green-300 line-through' : 'text-gray-200'}`}>
                          {item.task}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Assigned {new Date(item.assignedAt).toLocaleDateString()}
                          {item.completedAt && ` · Completed ${new Date(item.completedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'problems' && (
          <Card className="border border-emerald-500/30 bg-gray-900/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Tracked Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {problems.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No issues identified yet</p>
                  <p className="text-sm mt-1">As you share with your coach, they'll track recurring issues and help you work through them</p>
                </div>
              ) : (
                problems.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${
                    item.status === 'resolved' ? 'bg-green-500/10 border-green-500/30' :
                    item.status === 'improving' ? 'bg-blue-500/10 border-blue-500/30' :
                    item.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-200">{item.description}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Identified {new Date(item.identifiedAt).toLocaleDateString()}
                          {item.resolvedAt && ` · Resolved ${new Date(item.resolvedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Badge className={`text-[10px] px-2 py-0.5 ${
                        item.status === 'resolved' ? 'bg-green-500/20 text-green-300' :
                        item.status === 'improving' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-[10px] text-white/25 text-center mt-4 px-8">
          For support only — not a substitute for professional guidance.
        </p>
      </div>
      <CrisisBanner />
    </div>
  );
}
