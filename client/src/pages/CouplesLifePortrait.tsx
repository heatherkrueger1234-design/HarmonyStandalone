import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SocialShareMenu } from '@/components/SocialShareMenu';
import { convertToInternalUrl } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Heart, Sparkles, Loader2, AlertTriangle,
  CheckCircle2, XCircle, Shield, Scale, TrendingUp,
  Search, Brain, Star, RefreshCw, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { useLocation, Link } from 'wouter';

function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/10 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function TierBanner({ dataSource }: { dataSource: string | undefined }) {
  if (!dataSource) return null;
  
  const isScreening = dataSource === 'screening';
  const isAmbi80 = dataSource === 'ambi80';
  
  if (isScreening) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-200">Your portrait is based on 15 questions — limited accuracy.</p>
          <p className="text-xs text-amber-200/60 mt-1">Take AMBI-181 for your full portrait and unlock deeper psychological insights.</p>
          <Link href="/comprehensive-quiz">
            <Button size="sm" className="mt-2 bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 text-xs">
              Take AMBI-181 Now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isAmbi80) {
    return (
      <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-200">Some deeper insights require AMBI-181.</p>
          <Link href="/comprehensive-quiz">
            <Button size="sm" variant="link" className="p-0 h-auto text-blue-300 hover:text-blue-200 text-xs font-bold underline">
              Upgrade to AMBI-181
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function AccuracyLockedSection({ title, dataSource }: { title: string; dataSource: string | undefined }) {
  const isFull = dataSource === 'ambi181';
  if (isFull) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white/70">{title}</h4>
        <Lock className="w-3 h-3 text-white/30" />
      </div>
      <div className="relative">
        <p className="text-xs text-white/20 select-none blur-[3px]">
          Detailed psychological sub-insights and deep behavioral analysis are locked based on your current assessment depth.
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link href="/comprehensive-quiz">
            <Button variant="outline" size="sm" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-[10px] h-7">
              Unlock with AMBI-181
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const LOADING_MESSAGES = [
  'Reading between the lines…',
  'Mapping personality constellations…',
  'Uncovering emotional blueprints…',
  'Identifying compatibility patterns…',
  'Crafting your Harmony portrait comparison…',
  'Almost there…',
];

export default function CouplesLifePortrait() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: searchData, isLoading: isSearching } = useQuery<{ users: any[] }>({
    queryKey: ['/api/couples/users', searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/couples/users?search=${encodeURIComponent(searchQuery)}`);
      return res.json();
    },
    enabled: true,
  });

  const compareMutation = useMutation({
    mutationFn: async (matchId: string) => {
      let msgInterval: ReturnType<typeof setInterval>;
      msgInterval = setInterval(() => {
        setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length);
      }, 4000);
      try {
        const response = await apiRequest('POST', '/api/life-portrait/compare', { matchId }, { timeout: 90000 });
        clearInterval(msgInterval);
        return response;
      } catch (e) {
        clearInterval(msgInterval);
        throw e;
      }
    },
    onError: () => {
      toast({ title: 'Comparison failed', description: 'Make sure both users have generated a Life Portrait first.', variant: 'destructive' });
    },
  });

  const availableUsers = (searchData?.users || []);
  const comparison = compareMutation.data as any;
  const hasResult = comparison?.success && comparison?.comparison;
  const comp = comparison?.comparison;

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button onClick={() => navigate('/harmony-hub')} className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Harmony Hub
          </button>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              Couples Life Portrait Compare
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              Compare Life Portraits
            </h1>
            <p className="text-white/50 max-w-lg mx-auto mt-2">
              Compare your psychological portrait with any member in the Harmony community — deep compatibility, red flags, and real talk.
            </p>
          </div>
        </motion.div>

        {/* User selector */}
        {!hasResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-6 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-indigo-500/20">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Choose a Harmony Member to Compare With</h2>
                  <p className="text-white/50 text-sm">Search any member in the Harmony community — both users need a generated portrait</p>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500/50"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />}
              </div>

              {availableUsers.length === 0 && !isSearching ? (
                <div className="text-center py-8 text-white/40">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No Harmony members found yet. Try a different search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                  {availableUsers.map((person: any) => (
                    <div key={person.id} onClick={() => setSelectedUserId(person.id)}
                      className={`relative cursor-pointer rounded-xl overflow-hidden transition-all ${selectedUserId === person.id ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-70 hover:opacity-100'}`}>
                      <Avatar className="w-full aspect-square rounded-xl">
                        <AvatarImage src={convertToInternalUrl(person.profileImageUrl)} className="object-cover" />
                        <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-lg rounded-xl w-full aspect-square flex items-center justify-center">
                          {(person.displayName || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-1">
                        <p className="text-white text-[10px] font-medium truncate text-center">{person.displayName}</p>
                      </div>
                      {selectedUserId === person.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {person.hasPortrait === false && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500/80 rounded text-[9px] text-white font-medium">
                          No Portrait
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={() => selectedUserId && compareMutation.mutate(selectedUserId)}
                disabled={!selectedUserId || compareMutation.isPending}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl"
              >
                {compareMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{LOADING_MESSAGES[loadingMsgIdx]}</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Compare Portraits</>
                )}
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {/* Loading state */}
        <AnimatePresence>
          {compareMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
              <GlassCard className="p-8 max-w-sm w-full text-center mx-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-semibold mb-2">Analysing Portraits…</p>
                <p className="text-white/50 text-sm">{LOADING_MESSAGES[loadingMsgIdx]}</p>
                <p className="text-white/30 text-xs mt-2">This takes about 60–90 seconds</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {hasResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => { compareMutation.reset(); setSelectedUserId(null); }}
                className="border-white/20 text-white/70 hover:bg-white/10 gap-2">
                <RefreshCw className="w-4 h-4" />Compare Someone Else
              </Button>
              <SocialShareMenu
                title="Couples Life Portrait Comparison"
                text={`Our Harmony portrait compatibility: ${comp?.overallScore ?? 0}%`}
                url={window.location.href}
              />
            </div>

            <TierBanner dataSource={comp.dataSource} />

            {/* Overall score */}
            <GlassCard className="p-6 border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium">
                  <Heart className="w-3 h-3" />Harmony Compatibility Score
                </div>
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-36 h-36" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#harmony-gradient)" strokeWidth="10"
                      strokeLinecap="round" strokeDasharray={`${(comp.overallScore / 100) * 314} 314`}
                      transform="rotate(-90 60 60)" />
                    <defs>
                      <linearGradient id="harmony-gradient" x1="0%" y1="0%" x2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      {comp.overallScore}%
                    </span>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Harmony</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Badge className={`text-sm px-4 py-1 border ${
                    comp.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                    comp.overallScore >= 65 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    comp.overallScore >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {comp.verdict || (comp.overallScore >= 80 ? 'Exceptional Harmony' : comp.overallScore >= 65 ? 'Strong Foundation' : comp.overallScore >= 50 ? 'Work in Progress' : 'Significant Challenges')}
                  </Badge>
                  <p className="text-sm text-white/60 max-w-md">
                    {comp.overallScore >= 80 ? 'Deep resonance across all dimensions. This connection has real staying power.' :
                     comp.overallScore >= 65 ? 'Solid compatibility with some natural friction — worth investing in together.' :
                     comp.overallScore >= 50 ? 'Real chemistry exists here, but meaningful differences will need active work.' :
                     'Fundamental differences present. Awareness and intentional effort are essential.'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <Link href="/harmony-hub">
                <div className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-950/60 to-purple-950/30 border border-indigo-500/20 hover:border-indigo-400/40 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/10 text-center">
                  <Heart className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
                  <h3 className="text-xs font-bold text-white">AI Coaching</h3>
                  <p className="text-indigo-300/50 text-[10px] mt-0.5">Harmony Hub</p>
                </div>
              </Link>
              <Link href="/life-together">
                <div className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-pink-950/60 to-rose-950/30 border border-pink-500/20 hover:border-pink-400/40 transition-all cursor-pointer shadow-lg hover:shadow-pink-500/10 text-center">
                  <TrendingUp className="w-5 h-5 text-pink-400 mx-auto mb-1.5" />
                  <h3 className="text-xs font-bold text-white">Life Together</h3>
                  <p className="text-pink-300/50 text-[10px] mt-0.5">Future timeline</p>
                </div>
              </Link>
              <button onClick={() => { compareMutation.reset(); setSelectedUserId(null); }}
                className="group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg text-center w-full">
                <RefreshCw className="w-5 h-5 text-white/50 mx-auto mb-1.5 group-hover:text-white/80 transition-colors" />
                <h3 className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">Compare Again</h3>
                <p className="text-white/30 text-[10px] mt-0.5">New person</p>
              </button>
            </div>

            {/* Trait comparisons */}
            {comp.traitComparisons && comp.traitComparisons.length > 0 && (
              <GlassCard className="p-6">
                <button onClick={() => toggle('traits')} className="w-full flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/20">
                      <Scale className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-semibold">Trait Face-Off</h3>
                  </div>
                  {expanded.traits ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {(expanded.traits !== false) && (
                  <div className="space-y-4">
                    {comp.traitComparisons.slice(0, 8).map((tc: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-white/50">
                          <span className="capitalize font-medium text-white/70">{tc.trait || tc.name}</span>
                          <div className="flex gap-4">
                            <span className="text-indigo-300">{comparison.myName || 'You'}: {tc.myScore ?? tc.score1 ?? '—'}</span>
                            <span className="text-purple-300">{comparison.theirName || 'Them'}: {tc.theirScore ?? tc.score2 ?? '—'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                              style={{ width: `${((tc.myScore ?? tc.score1 ?? 5) / 10) * 100}%` }} />
                          </div>
                          <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                              style={{ width: `${((tc.theirScore ?? tc.score2 ?? 5) / 10) * 100}%` }} />
                          </div>
                        </div>
                        {tc.narrative && (
                          <p className="text-xs text-white/50 italic">{tc.narrative}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Red flags / safety */}
            {comp.redFlagAnalysis && (
              <GlassCard className="p-6 border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-white font-semibold">Safety & Red Flag Analysis</h3>
                </div>
                <div className="space-y-3">
                  {(comp.redFlagAnalysis.flags || []).map((flag: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-300">{flag.title || flag.flag}</p>
                        {flag.description && <p className="text-xs text-white/50 mt-0.5">{flag.description}</p>}
                      </div>
                    </div>
                  ))}
                  {(!comp.redFlagAnalysis.flags || comp.redFlagAnalysis.flags.length === 0) && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm text-emerald-300">No major red flags detected in this pairing.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {/* Relationship success probability */}
            {comp.relationshipSuccessProbability && (
              <GlassCard className="p-6 border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Success Probability</h3>
                    <p className="text-xs text-white/40">AI-predicted long-term relationship success</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      {comp.relationshipSuccessProbability.percentage}%
                    </p>
                    <p className="text-xs text-white/40 mt-1">Success Rate</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Grade: {comp.relationshipSuccessProbability.grade}
                      </Badge>
                    </div>
                    {comp.relationshipSuccessProbability.reasons && (
                      <ul className="space-y-1">
                        {comp.relationshipSuccessProbability.reasons.slice(0, 3).map((r: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                            <Star className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Safety verdict */}
            {comp.safetyVerdict && (
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold">Safety Verdict</h3>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{comp.safetyVerdict}</p>
              </GlassCard>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
