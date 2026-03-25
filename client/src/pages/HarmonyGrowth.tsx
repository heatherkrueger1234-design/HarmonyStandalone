import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CrisisBanner } from '@/components/CrisisBanner';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { SEOHead } from '@/components/SEOHead';
import {
  Heart, Lock, Unlock, ArrowLeft, Sparkles, BookOpen, Users, Flame,
  CheckCircle2, Loader2, Send, Star, Music, Coffee, Droplets,
  MessageCircle, Camera, MapPin, Hand, Sunset, Pen, Brain,
  Shield, Target, Gift, Eye, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'gentle' | 'moderate' | 'deep';
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  userResponse?: string;
  harmonyFeedback?: string;
  personalizedFor?: string;
}

interface JointActivityTemplate {
  category: string;
  title: string;
  description: string;
  questions: Array<{ id: string; label: string; type: string; options?: string[] }>;
}

interface JointActivity {
  id: string;
  category: string;
  title: string;
  user1Response?: { userId: string; answers: Record<string, any>; submittedAt: string };
  user2Response?: { userId: string; answers: Record<string, any>; submittedAt: string };
  comparison?: { analysis?: string };
}

interface RekindlingActivity {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
}

const difficultyColors = {
  gentle: 'bg-green-500/20 text-green-300 border-green-500/30',
  moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  deep: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const categoryIcons: Record<string, any> = {
  intimacy: Heart, conflict: Shield, attachment: Brain, love_languages: Gift,
  boundaries: Target, appreciation: Star, healing: Sparkles, goals: Eye,
  communication: MessageCircle, connection: Users, household: Users,
  values: Star, expectations: Target, roles: Users, love_languages_joint: Gift,
};

const rekindlingIcons: Record<string, any> = {
  music: Music, heart: Heart, sparkles: Sparkles, coffee: Coffee,
  utensils: Coffee, droplets: Droplets, pen: Pen, star: Star,
  sunset: Sunset, camera: Camera, map: MapPin, message: MessageCircle,
  book: BookOpen, hand: Hand,
};

function PINGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: status } = useQuery<{ hasPIN: boolean; isUnlocked: boolean }>({
    queryKey: ['/api/harmony-growth/status'],
  });

  const setPINMutation = useMutation({
    mutationFn: async (newPin: string) => {
      const res = await apiRequest('POST', '/api/harmony-growth/pin/set', { pin: newPin });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/status'] });
      toast({ title: 'PIN Created', description: 'Your workspace is now protected.' });
      onUnlock();
    },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to set PIN' }),
  });

  const unlockMutation = useMutation({
    mutationFn: async (enteredPin: string) => {
      const res = await apiRequest('POST', '/api/harmony-growth/pin/unlock', { pin: enteredPin });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/status'] });
      toast({ title: 'Unlocked', description: 'Welcome to your growth workspace.' });
      onUnlock();
    },
    onError: () => toast({ variant: 'destructive', title: 'Wrong PIN', description: 'Please try again.' }),
  });

  if (status?.isUnlocked) {
    onUnlock();
    return null;
  }

  const hasPIN = status?.hasPIN;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border-white/[0.08] rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl text-white">
            {hasPIN ? 'Enter Your PIN' : 'Create Your Private PIN'}
          </CardTitle>
          <p className="text-white/60 text-sm mt-2">
            {hasPIN
              ? 'Enter your PIN to access your personal growth workspace'
              : 'Set a PIN to keep your growth work private from your partner on shared devices'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder={hasPIN ? 'Enter PIN...' : 'Create a 4+ character PIN...'}
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && pin.length >= 4) {
                if (hasPIN) unlockMutation.mutate(pin);
                else setPINMutation.mutate(pin);
              }
            }}
            className="bg-white/10 border-white/20 text-white text-center text-lg tracking-widest"
          />
          <Button
            onClick={() => hasPIN ? unlockMutation.mutate(pin) : setPINMutation.mutate(pin)}
            disabled={pin.length < 4 || unlockMutation.isPending || setPINMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700"
          >
            {(unlockMutation.isPending || setPINMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasPIN ? <><Unlock className="h-4 w-4 mr-2" /> Unlock</> : <><Lock className="h-4 w-4 mr-2" /> Set PIN</>}
          </Button>
          {!hasPIN && (
            <button onClick={() => onUnlock()} className="w-full text-sm text-white/40 hover:text-white/60 transition">
              Skip for now
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HomeworkSection() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ homework: HomeworkItem[] }>({
    queryKey: ['/api/harmony-growth/homework'],
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, response: text }: { id: string; response: string }) => {
      const res = await apiRequest('POST', `/api/harmony-growth/homework/${id}/submit`, { response: text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/homework'] });
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/status'] });
      setActiveId(null);
      setResponse('');
      toast({ title: 'Homework Submitted', description: 'Harmony is reviewing your response...' });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/harmony-growth/homework/generate');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/homework'] });
      toast({ title: 'New Assignments', description: 'Harmony has added new homework for you.' });
    },
  });

  const homework = data?.homework || [];
  const completed = homework.filter(h => h.status === 'completed');
  const pending = homework.filter(h => h.status !== 'completed');
  const progress = homework.length > 0 ? (completed.length / homework.length) * 100 : 0;

  if (isLoading) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5"><Skeleton className="h-5 w-32 bg-white/10" /><Skeleton className="h-3 w-24 bg-white/10" /></div>
        <Skeleton className="h-8 w-28 rounded-md bg-white/10" />
      </div>
      <Skeleton className="h-2 w-full rounded-full bg-white/10" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 space-y-2">
          <Skeleton className="h-4 w-1/2 bg-white/10" />
          <Skeleton className="h-3 w-3/4 bg-white/10" />
          <Skeleton className="h-8 w-24 rounded-md bg-white/10 mt-2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Homework</h3>
          <p className="text-white/50 text-sm">{completed.length} of {homework.length} completed</p>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
          size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          More Homework
        </Button>
      </div>

      <Progress value={progress} className="h-2 bg-white/10" />

      <div className="space-y-3">
        {pending.map(item => {
          const Icon = categoryIcons[item.category] || BookOpen;
          const isOpen = activeId === item.id;
          return (
            <motion.div key={item.id} layout>
              <Card className="bg-white/[0.04] border-white/[0.06] overflow-hidden rounded-2xl">
                <button className="w-full text-left p-4 flex items-start gap-3"
                  onClick={() => { setActiveId(isOpen ? null : item.id); setResponse(''); }}>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium">{item.title}</h4>
                      <Badge className={`text-xs ${difficultyColors[item.difficulty]}`}>{item.difficulty}</Badge>
                    </div>
                    <p className="text-white/60 text-sm">{item.description}</p>
                    {item.personalizedFor && (
                      <p className="text-cyan-400/70 text-xs mt-1 italic">{item.personalizedFor}</p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5 text-white/40" /> : <ChevronDown className="h-5 w-5 text-white/40" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                      <Textarea
                        placeholder="Share your thoughts, reflections, and insights..."
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        className="bg-white/10 border-white/20 text-white min-h-[120px] mb-3"
                      />
                      <Button onClick={() => submitMutation.mutate({ id: item.id, response })}
                        disabled={response.length < 10 || submitMutation.isPending}
                        className="bg-gradient-to-r from-cyan-600 to-emerald-600">
                        {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit & Get Harmony's Feedback
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white/70 font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Completed ({completed.length})
          </h4>
          {completed.map(item => (
            <Card key={item.id} className="bg-green-500/[0.04] border-green-500/20 rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <Badge className={`text-xs ${difficultyColors[item.difficulty]}`}>{item.difficulty}</Badge>
                </div>
                {item.userResponse && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/70 text-sm">{item.userResponse}</p>
                  </div>
                )}
                {item.harmonyFeedback && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-lg p-3 border border-cyan-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-cyan-300 text-sm font-medium">Harmony says</span>
                    </div>
                    <p className="text-white/80 text-sm">{item.harmonyFeedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function JointActivitiesSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{
    templates: JointActivityTemplate[];
    activities: JointActivity[];
    needsPartner: boolean;
  }>({
    queryKey: ['/api/harmony-growth/joint-activities'],
  });

  const submitMutation = useMutation({
    mutationFn: async ({ category, answers: a }: { category: string; answers: Record<string, any> }) => {
      const res = await apiRequest('POST', '/api/harmony-growth/joint-activities/submit', { category, answers: a });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/joint-activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/harmony-growth/status'] });
      setActiveCategory(null);
      setAnswers({});
      toast({
        title: data.bothCompleted ? 'Both Partners Done!' : 'Your Responses Saved',
        description: data.bothCompleted ? 'Check out the comparison results!' : 'Waiting for your partner to complete theirs.',
      });
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/10 space-y-2">
          <Skeleton className="h-4 w-2/5 bg-white/10" />
          <Skeleton className="h-3 w-3/5 bg-white/10" />
          <div className="flex gap-2 mt-3">{[...Array(4)].map((_, j) => <Skeleton key={j} className="h-16 w-16 rounded-lg bg-white/10" />)}</div>
        </div>
      ))}
    </div>
  );

  if (data?.needsPartner) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Link Your Partner First</h3>
          <p className="text-white/50 mb-4">Joint activities require a linked partner account. Go to the Harmony Hub to send a partner invite.</p>
          <Link href="/harmony-hub">
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600">Go to Harmony Hub</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const templates = data?.templates || [];
  const activities = data?.activities || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Relationship Activities</h3>
      <p className="text-white/50 text-sm">Complete these independently, then compare your answers together.</p>

      {templates.map(template => {
        const existing = activities.find(a => a.category === template.category);
        const bothDone = existing?.user1Response && existing?.user2Response;
        const youDone = existing?.user1Response || existing?.user2Response;
        const Icon = categoryIcons[template.category] || Users;
        const isOpen = activeCategory === template.category;

        return (
          <Card key={template.category} className={`border transition ${bothDone ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
            <button className="w-full text-left p-4 flex items-start gap-3"
              onClick={() => { setActiveCategory(isOpen ? null : template.category); setAnswers({}); }}>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bothDone ? 'bg-green-500/20' : 'bg-gradient-to-br from-cyan-500/30 to-emerald-500/30'}`}>
                <Icon className={`h-5 w-5 ${bothDone ? 'text-green-300' : 'text-cyan-300'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-white font-medium">{template.title}</h4>
                  {bothDone && <Badge className="bg-green-500/20 text-green-300 text-xs">Both Done</Badge>}
                  {youDone && !bothDone && <Badge className="bg-amber-500/20 text-amber-300 text-xs">Waiting for Partner</Badge>}
                </div>
                <p className="text-white/60 text-sm mt-1">{template.description}</p>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5 text-white/40" /> : <ChevronDown className="h-5 w-5 text-white/40" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                  {bothDone && existing?.comparison?.analysis ? (
                    <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-lg p-4 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-cyan-300" />
                        <span className="text-cyan-300 font-medium">Harmony's Comparison</span>
                      </div>
                      <p className="text-white/80 text-sm whitespace-pre-wrap">{existing.comparison.analysis}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {template.questions.map(q => (
                        <div key={q.id} className="space-y-2">
                          <label className="text-white/80 text-sm font-medium">{q.label}</label>
                          {q.type === 'text' && (
                            <Textarea
                              value={answers[q.id] || ''}
                              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="bg-white/10 border-white/20 text-white min-h-[80px]"
                              placeholder="Your honest answer..."
                            />
                          )}
                          {q.type === 'rating' && (
                            <div className="flex gap-1">
                              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                <button key={n} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: n }))}
                                  className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                                    answers[q.id] === n ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}
                          {q.type === 'number' && (
                            <Input
                              type="number"
                              value={answers[q.id] || ''}
                              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
                              className="bg-white/10 border-white/20 text-white w-32"
                              placeholder="0"
                            />
                          )}
                          {q.type === 'slider' && (
                            <div className="space-y-1">
                              <input
                                type="range" min="1" max="10" value={answers[q.id] || 5}
                                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
                                className="w-full accent-cyan-500"
                              />
                              <div className="flex justify-between text-xs text-white/40">
                                <span>Mostly me</span>
                                <span>{answers[q.id] || 5}/10</span>
                                <span>Mostly partner</span>
                              </div>
                            </div>
                          )}
                          {q.type === 'choice' && q.options && (
                            <div className="flex flex-wrap gap-2">
                              {q.options.map(opt => (
                                <button key={opt}
                                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                                    answers[q.id] === opt ? 'bg-cyan-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <Button onClick={() => submitMutation.mutate({ category: template.category, answers })}
                        disabled={Object.keys(answers).length < 2 || submitMutation.isPending}
                        className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600 mt-2">
                        {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Submit My Answers
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

function RekindlingSection() {
  const [completedId, setCompletedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { toast } = useToast();

  const { data } = useQuery<{ activities: RekindlingActivity[] }>({
    queryKey: ['/api/harmony-growth/rekindling'],
  });

  const completeMutation = useMutation({
    mutationFn: async ({ activityId, notes: n }: { activityId: string; notes: string }) => {
      const res = await apiRequest('POST', '/api/harmony-growth/rekindling/complete', { activityId, notes: n });
      return res.json();
    },
    onSuccess: (data) => {
      setFeedback(data.feedback);
      toast({ title: 'Beautiful!', description: `${data.totalCompleted} rekindling activities completed.` });
    },
  });

  const activities = data?.activities || [];
  const categories = ['spontaneous', 'touch', 'service', 'words', 'quality_time'];
  const categoryLabels: Record<string, string> = {
    spontaneous: 'Spontaneous Gestures', touch: 'Physical Connection',
    service: 'Acts of Love', words: 'Words That Matter', quality_time: 'Intentional Time',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-400" /> Rekindle Your Love
        </h3>
        <p className="text-white/50 text-sm mt-1">Small intentional acts that reignite connection. Do one today.</p>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-cyan-400" />
                  <span className="text-cyan-300 font-medium">Harmony says</span>
                  <button onClick={() => { setFeedback(null); setCompletedId(null); setNotes(''); }}
                    className="ml-auto text-white/40 hover:text-white/60 text-xs">Dismiss</button>
                </div>
                <p className="text-white/80 text-sm">{feedback}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {categories.map(cat => {
        const catActivities = activities.filter(a => a.category === cat);
        if (catActivities.length === 0) return null;
        return (
          <div key={cat}>
            <h4 className="text-white/70 font-medium text-sm mb-3">{categoryLabels[cat]}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catActivities.map(activity => {
                const Icon = rekindlingIcons[activity.icon] || Heart;
                const isActive = completedId === activity.id;
                return (
                  <Card key={activity.id} className={`bg-white/5 border transition cursor-pointer ${isActive ? 'border-cyan-500/40' : 'border-white/10 hover:border-white/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-orange-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-white text-sm font-medium">{activity.title}</h5>
                          <p className="text-white/50 text-xs mt-1">{activity.description}</p>
                        </div>
                      </div>
                      {isActive ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            placeholder="How did it go? (optional)"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="bg-white/10 border-white/20 text-white min-h-[60px] text-sm"
                          />
                          <Button size="sm" onClick={() => completeMutation.mutate({ activityId: activity.id, notes })}
                            disabled={completeMutation.isPending}
                            className="bg-gradient-to-r from-orange-500 to-cyan-500 text-sm">
                            {completeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                            Mark Complete
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => { setCompletedId(activity.id); setNotes(''); setFeedback(null); }}
                          className="mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-white/5 text-xs p-0 h-auto">
                          I did this
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InteractionGuideSection() {
  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    needsPartner?: boolean;
    guide?: {
      userName: string;
      partnerName: string;
      myAttachment: string;
      theirAttachment: string;
      myLoveLanguage: string;
      theirLoveLanguage: string;
      myConflictStyle: string;
      theirConflictStyle: string;
      fullGuide?: string;
    };
  }>({
    queryKey: ['/api/harmony-growth/interaction-guide'],
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-white/10 space-y-3">
        <Skeleton className="h-5 w-1/3 bg-white/10" />
        <Skeleton className="h-3 w-full bg-white/10" />
        <Skeleton className="h-3 w-5/6 bg-white/10" />
        <Skeleton className="h-3 w-4/6 bg-white/10" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg border border-white/10 flex gap-3 items-start">
          <Skeleton className="h-8 w-8 rounded-full bg-white/10 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/5 bg-white/10" />
            <Skeleton className="h-3 w-3/4 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );

  if (data?.needsPartner) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-2">Link Your Partner First</h3>
          <p className="text-white/50 mb-4">The interaction guide uses both partners' personality data to create personalized advice.</p>
          <Link href="/harmony-hub">
            <Button className="bg-gradient-to-r from-cyan-600 to-emerald-600">Go to Harmony Hub</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const guide = data?.guide;
  if (!guide) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-400" /> How You Two Work
          </h3>
          <p className="text-white/50 text-sm mt-1">Personalized interaction guide based on both your personality profiles</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} className="border-white/20 text-white hover:bg-white/10">
          <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: guide.userName, attachment: guide.myAttachment, love: guide.myLoveLanguage, conflict: guide.myConflictStyle },
          { label: guide.partnerName, attachment: guide.theirAttachment, love: guide.theirLoveLanguage, conflict: guide.theirConflictStyle },
        ].map((p, i) => (
          <Card key={i} className="bg-white/5 border-white/10">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-white font-medium">{p.label}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Shield className="h-3.5 w-3.5 text-blue-400" />
                  <span>Attachment: <span className="text-white">{p.attachment}</span></span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Heart className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Love Language: <span className="text-white">{p.love}</span></span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Conflict Style: <span className="text-white">{p.conflict}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {guide.fullGuide && (
        <Card className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-emerald-300 font-medium">Harmony's Relationship Guide</span>
            </div>
            <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">{guide.fullGuide}</div>
          </CardContent>
        </Card>
      )}

      {!guide.fullGuide && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 text-center">
            <p className="text-white/50">Both partners need completed personality assessments (Life Portrait) to generate the full interaction guide.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ChatMessage {
  role: 'user' | 'harmony';
  content: string;
  timestamp: string;
}

function HarmonyChatSection() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: historyData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ['/api/harmony-growth/chat/history'],
  });

  const { data: homeworkData } = useQuery<{ homework: HomeworkItem[] }>({
    queryKey: ['/api/harmony-growth/homework'],
  });

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(historyData.messages);
    }
  }, [historyData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await apiRequest('POST', '/api/harmony-growth/chat', { message: msg });
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'harmony', content: data.response, timestamp: new Date().toISOString() }
      ]);
    },
    onError: () => toast({ variant: 'destructive', title: 'Error', description: 'Failed to get response from Harmony' }),
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    const msg = message.trim();
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }]);
    setMessage('');
    sendMutation.mutate(msg);
  };

  const completedHomework = homeworkData?.homework?.filter(h => h.status === 'completed') || [];
  const pendingHomework = homeworkData?.homework?.filter(h => h.status !== 'completed') || [];

  const quickPrompts = [
    "How am I doing on my growth journey?",
    "What should I focus on next?",
    "I'm struggling with my homework assignment",
    "Help me understand my attachment style",
    "I want to talk about our conflict patterns",
    "How can I be a better partner?",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-cyan-400" /> Talk to Harmony
          </h3>
          <p className="text-white/50 text-sm mt-1">Your relationship coach knows your growth journey</p>
        </div>
        <Link href="/harmony-therapist">
          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-xs">
            <MessageCircle className="h-3 w-3 mr-1" /> Full Sessions
          </Button>
        </Link>
      </div>

      {completedHomework.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span>Harmony knows about your {completedHomework.length} completed homework assignments, activities, and growth progress</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="h-[400px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-600/20 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-cyan-400" />
                </div>
                <p className="text-white/70 text-sm mb-1">Welcome to your Harmony chat</p>
                <p className="text-white/40 text-xs mb-6">I know your growth journey — homework, activities, personality. Let's talk.</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {quickPrompts.map((prompt, i) => (
                    <button key={i} onClick={() => { setMessage(prompt); }}
                      className="px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-br-md'
                    : 'bg-white/10 text-white/90 rounded-bl-md'
                }`}>
                  {msg.role === 'harmony' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center">
                        <Heart className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-cyan-300 text-xs font-medium">Harmony</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center">
                      <Heart className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-cyan-300 text-xs font-medium">Harmony</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                    <span className="text-white/50 text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-white/10 p-3 flex gap-2">
            <Input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Talk to Harmony about your growth..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending}
              className="bg-gradient-to-r from-cyan-600 to-emerald-600 px-4">
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {pendingHomework.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <p className="text-white/50 text-xs mb-2">Ask Harmony about your current assignments:</p>
            <div className="flex flex-wrap gap-2">
              {pendingHomework.slice(0, 3).map(hw => (
                <button key={hw.id} onClick={() => setMessage(`Help me with my "${hw.title}" homework`)}
                  className="px-3 py-1.5 rounded-full text-xs bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition border border-cyan-500/20">
                  {hw.title}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function HarmonyGrowth() {
  const [, navigate] = useLocation();
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('harmony');

  const { data: status, isLoading: statusLoading } = useQuery<{
    hasPartner: boolean;
    partnerName: string | null;
    hasPIN: boolean;
    isUnlocked: boolean;
    stats: {
      totalHomework: number;
      completedHomework: number;
      pendingHomework: number;
      jointActivitiesCompleted: number;
      rekindlingCompleted: number;
    };
  }>({
    queryKey: ['/api/harmony-growth/status'],
  });

  const needsPIN = status?.hasPIN && !status?.isUnlocked && !unlocked;
  const accessGranted = !statusLoading && !needsPIN;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/30 to-slate-950 py-6 px-4">
      <SEOHead title="Growth & Healing — Harmony Hub | SyncWithInsight" description="Strengthen your relationship with evidence-based homework, joint activities, rekindling rituals, and AI interaction guides — built for couples." />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/harmony-hub')} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Growth & Healing
            </h1>
            <p className="text-white/50 text-sm">
              {status?.hasPartner ? `Working with ${status.partnerName || 'your partner'}` : 'Personal growth space'}
            </p>
          </div>
        </div>

        {status && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-cyan-300">{status.stats.completedHomework}</p>
                <p className="text-white/50 text-xs">Homework Done</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-emerald-300">{status.stats.jointActivitiesCompleted}</p>
                <p className="text-white/50 text-xs">Joint Activities</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-orange-300">{status.stats.rekindlingCompleted}</p>
                <p className="text-white/50 text-xs">Rekindling Acts</p>
              </CardContent>
            </Card>
          </div>
        )}

        {statusLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        ) : needsPIN ? (
          <PINGate onUnlock={() => setUnlocked(true)} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-white/5 border border-white/10 p-1 flex-wrap h-auto gap-1">
              <TabsTrigger value="harmony" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/60">
                <Heart className="h-4 w-4 mr-1.5" /> Harmony
              </TabsTrigger>
              <TabsTrigger value="my-growth" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/60">
                <BookOpen className="h-4 w-4 mr-1.5" /> Homework
              </TabsTrigger>
              <TabsTrigger value="together" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/60">
                <Users className="h-4 w-4 mr-1.5" /> Together
              </TabsTrigger>
              <TabsTrigger value="rekindle" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/60">
                <Flame className="h-4 w-4 mr-1.5" /> Rekindle
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/60">
                <Brain className="h-4 w-4 mr-1.5" /> Guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="harmony" className="mt-6">
              <HarmonyChatSection />
            </TabsContent>

            <TabsContent value="my-growth" className="mt-6">
              <HomeworkSection />
            </TabsContent>

            <TabsContent value="together" className="mt-6">
              <JointActivitiesSection />
            </TabsContent>

            <TabsContent value="rekindle" className="mt-6">
              <RekindlingSection />
            </TabsContent>

            <TabsContent value="guide" className="mt-6">
              <InteractionGuideSection />
            </TabsContent>
          </Tabs>
        )}

        <CrisisBanner variant="footer" className="mt-6" />
      </div>
    </div>
  );
}
