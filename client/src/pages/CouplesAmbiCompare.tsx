import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Heart, Shield, AlertTriangle, Users, ChevronRight,
  Zap, CheckCircle, XCircle, Info, ArrowLeft, Flame,
  Activity, Target, Eye, BarChart3, RefreshCw
} from "lucide-react";

interface PartnerCompare {
  user: { name: string; completed: boolean; scores: any; attachmentStyle?: string; loveLanguage?: string; bigFiveScores?: any };
  partner: { name: string; completed: boolean; scores: any; attachmentStyle?: string; loveLanguage?: string; bigFiveScores?: any };
}

interface RealityCheck {
  overallScore: number;
  verdict: string;
  verdictSummary: string;
  redFlags: Array<{ trait: string; person: string; severity: "moderate" | "high" | "critical"; explanation: string }>;
  traitClashes: Array<{ dimension: string; p1Score: number; p2Score: number; gap: number; impact: string }>;
  biggestThreats: string[];
  strengthsIfAny: string;
  honestyNote: string;
}

const HEXACO_LABELS: Record<string, string> = {
  H: "Honesty-Humility", HH: "Honesty-Humility",
  E: "Emotionality", EM: "Emotionality",
  X: "Extraversion", EX: "Extraversion",
  A: "Agreeableness", AG: "Agreeableness",
  C: "Conscientiousness", CO: "Conscientiousness",
  O: "Openness", OP: "Openness",
};

const BIGFIVE_LABELS: Record<string, string> = {
  openness: "Openness", conscientiousness: "Conscientiousness",
  extraversion: "Extraversion", agreeableness: "Agreeableness", neuroticism: "Emotional Depth",
  O: "Openness", C: "Conscientiousness", E: "Extraversion", A: "Agreeableness", N: "Emotional Depth",
};

function verdictColor(verdict: string) {
  if (verdict?.includes("strong")) return { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300", icon: CheckCircle };
  if (verdict?.includes("worth")) return { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300", icon: Info };
  if (verdict?.includes("serious")) return { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-300", icon: AlertTriangle };
  if (verdict?.includes("fundamental")) return { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-300", icon: XCircle };
  if (verdict?.includes("toxic")) return { bg: "bg-red-600/30", border: "border-red-600/50", text: "text-red-200", icon: Zap };
  return { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-300", icon: Info };
}

function severityStyle(severity: string) {
  if (severity === "critical") return "bg-red-600/30 border-red-500/50 text-red-200";
  if (severity === "high")     return "bg-orange-500/20 border-orange-500/40 text-orange-300";
  return "bg-amber-500/15 border-amber-500/30 text-amber-300";
}

function ScoreBar({ label, p1Score, p2Score, p1Name, p2Name }: {
  label: string; p1Score: number; p2Score: number; p1Name: string; p2Name: string;
}) {
  const gap = Math.abs(p1Score - p2Score);
  const gapColor = gap > 30 ? "text-red-400" : gap > 15 ? "text-amber-400" : "text-emerald-400";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">{label}</span>
        <span className={`text-xs font-bold ${gapColor}`}>Gap: {gap}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-teal-300 w-16 truncate">{p1Name}</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${p1Score}%` }} />
          </div>
          <span className="text-[10px] text-white/60 w-6 text-right">{p1Score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-300 w-16 truncate">{p2Name}</span>
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${p2Score}%` }} />
          </div>
          <span className="text-[10px] text-white/60 w-6 text-right">{p2Score}</span>
        </div>
      </div>
    </div>
  );
}

function ProfilePanel({ data, label, colorClass, onTakeTest }: {
  data: PartnerCompare["user"] | null;
  label: string;
  colorClass: string;
  onTakeTest: () => void;
}) {
  const hexaco = data?.scores || {};
  const bigFive = data?.bigFiveScores || {};

  if (!data) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Partner data not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/60 border border-slate-700/60`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base font-bold ${colorClass} flex items-center gap-2`}>
          <Brain className="w-4 h-4" />
          {data.name || label}
          {data.completed
            ? <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] ml-auto">Assessment Done</Badge>
            : <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] ml-auto">Pending</Badge>
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data.completed ? (
          <div className="text-center py-4">
            <p className="text-slate-400 text-sm mb-3">No assessment completed yet.</p>
            <Button onClick={onTakeTest} className="bg-teal-600 hover:bg-teal-500 text-white text-sm">
              Take AMBI Assessment
            </Button>
          </div>
        ) : (
          <>
            {Object.keys(hexaco).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">HEXACO Traits</p>
                <div className="space-y-2">
                  {Object.entries(hexaco).map(([key, val]) => {
                    const label = HEXACO_LABELS[key] || key;
                    const score = typeof val === "number" ? val : 50;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/50 w-28 truncate">{label}</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colorClass.includes("teal") ? "bg-teal-500" : "bg-cyan-500"}`} style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-[10px] text-white/60 w-6">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(bigFive).length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-2">Big Five</p>
                <div className="space-y-2">
                  {Object.entries(bigFive).map(([key, val]) => {
                    const label = BIGFIVE_LABELS[key] || key;
                    const score = typeof val === "number" ? Math.round(val) : 50;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/50 w-28 truncate">{label}</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colorClass.includes("teal") ? "bg-teal-500" : "bg-cyan-500"}`} style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-[10px] text-white/60 w-6">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {data.attachmentStyle && (
                <div className="bg-slate-700/40 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-white/40">Attachment</p>
                  <p className="text-xs font-semibold text-white capitalize">{data.attachmentStyle}</p>
                </div>
              )}
              {data.loveLanguage && (
                <div className="bg-slate-700/40 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-white/40">Love Language</p>
                  <p className="text-xs font-semibold text-white capitalize">{data.loveLanguage}</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CouplesAmbiCompare() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profiles");

  const { data: compareData, isLoading: compareLoading } = useQuery<PartnerCompare>({
    queryKey: ["/api/partner/ambi-compare"],
    retry: false,
  });

  const realityMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/couples/ambi-reality-check", {});
      return res.json();
    },
    onError: (err: any) => {
      toast({ title: "Reality Check Failed", description: err?.message || "Complete your AMBI assessment first.", variant: "destructive" });
    },
  });

  const realityData = realityMutation.data as RealityCheck | undefined;
  const vc = realityData ? verdictColor(realityData.verdict) : null;
  const VerdictIcon = vc?.icon || Info;

  const partnerLinked = !!compareData?.partner?.completed;
  const myAssessmentDone = compareData?.user?.completed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/30 to-slate-900 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/harmony-hub")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Couples Compatibility</h1>
            <p className="text-[10px] text-white/40">AMBI Score Comparison & Reality Check</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Intro banner */}
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Eye className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal-200">Honest personality-based compatibility</p>
            <p className="text-xs text-teal-200/60 mt-0.5">Both partners take the AMBI assessment. The AI then gives a frank, unfiltered read on your long-term viability — red flags included.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-full">
            <TabsTrigger value="profiles"  className="rounded-lg text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white">Profiles</TabsTrigger>
            <TabsTrigger value="compare"   className="rounded-lg text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white">Compare</TabsTrigger>
            <TabsTrigger value="reality"   className="rounded-lg text-xs data-[state=active]:bg-red-700 data-[state=active]:text-white">Reality Check</TabsTrigger>
          </TabsList>

          {/* ── TAB 1: Profiles ── */}
          <TabsContent value="profiles" className="mt-4 space-y-4">
            {compareLoading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-48 bg-slate-800/40 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <>
                <ProfilePanel
                  data={compareData?.user ?? null}
                  label="Your Profile"
                  colorClass="text-teal-300"
                  onTakeTest={() => setLocation("/ambi-hub")}
                />
                <ProfilePanel
                  data={compareData?.partner ?? null}
                  label="Partner Profile"
                  colorClass="text-cyan-300"
                  onTakeTest={() => setLocation("/optional-tests/ambi-181")}
                />

                {!partnerLinked && (
                  <Card className="bg-slate-800/40 border border-slate-700/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-400" />
                        <p className="text-sm font-semibold text-white">Partner not linked?</p>
                      </div>
                      <p className="text-xs text-slate-400">Have your partner sign up and enter your invite code to link accounts. Once linked, their assessment data automatically appears here for comparison.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10 text-xs"
                        onClick={() => setLocation("/harmony-hub")}
                      >
                        Go to Harmony Hub to invite partner <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-5"
                  disabled={!myAssessmentDone || !partnerLinked}
                  onClick={() => setActiveTab("compare")}
                >
                  {!myAssessmentDone ? "Complete your assessment first" :
                   !partnerLinked ? "Waiting for partner assessment" :
                   "View Side-by-Side Comparison →"}
                </Button>
              </>
            )}
          </TabsContent>

          {/* ── TAB 2: Compare ── */}
          <TabsContent value="compare" className="mt-4 space-y-4">
            {!compareData?.user?.completed || !compareData?.partner?.completed ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center space-y-3">
                  <Activity className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-white/70 text-sm">Both partners need to complete the AMBI assessment before you can compare.</p>
                  <Button onClick={() => setActiveTab("profiles")} variant="outline" size="sm" className="border-teal-500/40 text-teal-300">
                    Go to Profiles tab
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-xs text-white/40 text-center">Bars show 0–100 scores. Gaps over 30 points signal significant trait differences.</p>

                {/* HEXACO comparison */}
                {Object.keys(compareData.user.scores || {}).length > 0 && (
                  <Card className="bg-slate-800/60 border border-slate-700/60">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-white flex items-center gap-2"><Brain className="w-4 h-4 text-teal-400" /> HEXACO Traits</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {Object.keys({ ...compareData.user.scores, ...compareData.partner.scores }).map(key => {
                        const label = HEXACO_LABELS[key] || key;
                        const s1 = typeof compareData.user.scores[key] === "number" ? compareData.user.scores[key] : 50;
                        const s2 = typeof compareData.partner.scores[key] === "number" ? compareData.partner.scores[key] : 50;
                        return <ScoreBar key={key} label={label} p1Score={s1} p2Score={s2} p1Name={compareData.user.name} p2Name={compareData.partner.name} />;
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Big Five comparison */}
                {(compareData.user.bigFiveScores || compareData.partner.bigFiveScores) && (
                  <Card className="bg-slate-800/60 border border-slate-700/60">
                    <CardHeader className="pb-2"><CardTitle className="text-sm text-white flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" /> Big Five Personality</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {Object.keys({ ...(compareData.user.bigFiveScores || {}), ...(compareData.partner.bigFiveScores || {}) }).map(key => {
                        const label = BIGFIVE_LABELS[key] || key;
                        const s1 = typeof (compareData.user.bigFiveScores || {})[key] === "number" ? Math.round((compareData.user.bigFiveScores || {})[key]) : 50;
                        const s2 = typeof (compareData.partner.bigFiveScores || {})[key] === "number" ? Math.round((compareData.partner.bigFiveScores || {})[key]) : 50;
                        return <ScoreBar key={key} label={label} p1Score={s1} p2Score={s2} p1Name={compareData.user.name} p2Name={compareData.partner.name} />;
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Attachment & Love Language */}
                <Card className="bg-slate-800/60 border border-slate-700/60">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-white flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Attachment & Love Language</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {[compareData.user, compareData.partner].map((p, i) => (
                        <div key={i} className={`rounded-xl p-3 ${i === 0 ? "bg-teal-500/10 border border-teal-500/20" : "bg-cyan-500/10 border border-cyan-500/20"}`}>
                          <p className={`text-[10px] font-bold ${i === 0 ? "text-teal-300" : "text-cyan-300"} mb-2`}>{p.name}</p>
                          <div className="space-y-1.5">
                            <div>
                              <p className="text-[10px] text-white/40">Attachment</p>
                              <p className="text-xs text-white font-medium capitalize">{p.attachmentStyle || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40">Love Language</p>
                              <p className="text-xs text-white font-medium capitalize">{p.loveLanguage || "Unknown"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-bold py-5"
                  onClick={() => { setActiveTab("reality"); realityMutation.mutate(); }}
                >
                  <Flame className="w-4 h-4 mr-2" /> Run AI Reality Check →
                </Button>
              </>
            )}
          </TabsContent>

          {/* ── TAB 3: Reality Check ── */}
          <TabsContent value="reality" className="mt-4 space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300/80">This is an honest, unfiltered AI assessment based on personality science. It does not sugarcoat. Red flags are reported as they are.</p>
            </div>

            {!realityData && !realityMutation.isPending && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                    <Shield className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Ready for the honest truth?</p>
                    <p className="text-white/50 text-sm mt-1">The AI will analyse both personality profiles and give a frank prognosis.</p>
                  </div>
                  <Button
                    className="bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-bold"
                    onClick={() => realityMutation.mutate()}
                    disabled={!compareData?.user?.completed || !compareData?.partner?.completed}
                  >
                    <Flame className="w-4 h-4 mr-2" /> Generate Reality Check
                  </Button>
                  {(!compareData?.user?.completed || !compareData?.partner?.completed) && (
                    <p className="text-xs text-amber-400">Both partners need to complete the AMBI assessment first.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {realityMutation.isPending && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-white/60 text-sm">Analysing personality scores honestly…</p>
                </CardContent>
              </Card>
            )}

            {realityData && vc && (
              <AnimatePresence>
                <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                  {/* Overall verdict */}
                  <Card className={`${vc.bg} border ${vc.border}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <VerdictIcon className={`w-5 h-5 ${vc.text}`} />
                          <span className={`text-sm font-bold ${vc.text} capitalize`}>{realityData.verdict}</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-black ${vc.text}`}>{realityData.overallScore}%</p>
                          <p className="text-[10px] text-white/40">compatibility</p>
                        </div>
                      </div>
                      <Progress value={realityData.overallScore} className="h-2 mb-3" />
                      <p className="text-sm text-white/80 leading-relaxed">{realityData.verdictSummary}</p>
                    </CardContent>
                  </Card>

                  {/* Red Flags */}
                  {realityData.redFlags?.length > 0 && (
                    <Card className="bg-slate-800/60 border border-red-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Red Flags ({realityData.redFlags.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {realityData.redFlags.map((flag, i) => (
                          <div key={i} className={`rounded-xl p-3 border ${severityStyle(flag.severity)}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-bold">{flag.trait}</span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge className={`text-[10px] px-1.5 py-0 ${flag.severity === "critical" ? "bg-red-600/40 text-red-200" : flag.severity === "high" ? "bg-orange-500/30 text-orange-300" : "bg-amber-500/20 text-amber-300"} border-0`}>
                                  {flag.severity}
                                </Badge>
                                <span className="text-[10px] text-white/40">{flag.person}</span>
                              </div>
                            </div>
                            <p className="text-[11px] text-white/60 leading-relaxed">{flag.explanation}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Trait Clashes */}
                  {realityData.traitClashes?.length > 0 && (
                    <Card className="bg-slate-800/60 border border-slate-700/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" /> Trait Clashes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {realityData.traitClashes.map((clash, i) => {
                          const gapBig = clash.gap > 30;
                          return (
                            <div key={i} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/70 font-medium">{clash.dimension}</span>
                                <span className={`text-xs font-bold ${gapBig ? "text-red-400" : "text-amber-400"}`}>Δ {clash.gap}</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-teal-300 w-16 truncate">{compareData?.user?.name || "P1"}</span>
                                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${clash.p1Score}%` }} />
                                  </div>
                                  <span className="text-[10px] text-white/50 w-5">{clash.p1Score}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-cyan-300 w-16 truncate">{compareData?.partner?.name || "P2"}</span>
                                  <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${clash.p2Score}%` }} />
                                  </div>
                                  <span className="text-[10px] text-white/50 w-5">{clash.p2Score}</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-white/50 pl-1">{clash.impact}</p>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}

                  {/* Biggest Threats */}
                  {realityData.biggestThreats?.length > 0 && (
                    <Card className="bg-slate-800/60 border border-orange-500/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-orange-300 flex items-center gap-2">
                          <Flame className="w-4 h-4" /> Biggest Threats to This Relationship
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {realityData.biggestThreats.map((threat, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                              <span className="text-orange-400 font-bold mt-0.5">{i + 1}.</span>
                              <span>{threat}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Strengths if any */}
                  {realityData.strengthsIfAny && (
                    <Card className="bg-emerald-900/20 border border-emerald-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-emerald-300 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Strengths (Where They Exist)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/70 leading-relaxed">{realityData.strengthsIfAny}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Honest Note */}
                  {realityData.honestyNote && (
                    <Card className="bg-slate-700/40 border border-slate-600/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-white flex items-center gap-2">
                          <Info className="w-4 h-4 text-teal-400" /> From Your AI Psychologist
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/70 leading-relaxed italic">"{realityData.honestyNote}"</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Re-run button */}
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-400 hover:text-white text-sm"
                    onClick={() => realityMutation.mutate()}
                    disabled={realityMutation.isPending}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-2" /> Re-run Reality Check
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
