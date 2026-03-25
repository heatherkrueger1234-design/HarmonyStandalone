// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, ArrowLeft, Sparkles, TrendingUp, Heart,
  CheckCircle2, AlertTriangle, RefreshCw, Brain,
  Star, ChevronRight, Info
} from "lucide-react";
import { CrisisBanner } from "@/components/CrisisBanner";

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return { text: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500', ring: 'ring-emerald-400/40' };
  if (grade.startsWith('B')) return { text: 'text-blue-400',    bg: 'from-blue-500 to-indigo-500',   ring: 'ring-blue-400/40' };
  if (grade.startsWith('C')) return { text: 'text-amber-400',   bg: 'from-amber-500 to-orange-500',  ring: 'ring-amber-400/40' };
  if (grade.startsWith('D')) return { text: 'text-orange-500',  bg: 'from-orange-500 to-red-500',    ring: 'ring-orange-400/40' };
  return { text: 'text-red-500', bg: 'from-red-500 to-rose-600', ring: 'ring-red-400/40' };
}

function gradeMessage(grade: string) {
  if (grade === 'A+') return "Outstanding! You show exceptional relationship readiness.";
  if (grade === 'A')  return "Excellent! Strong foundations across all key areas.";
  if (grade === 'A-') return "Great! Minor areas to polish, but very strong overall.";
  if (grade === 'B+') return "Very good! You have solid relationship skills with clear potential.";
  if (grade === 'B')  return "Good. You're building a healthy relationship foundation.";
  if (grade === 'B-') return "Decent — keep working on the growth areas identified.";
  if (grade === 'C+') return "On the path. There's meaningful progress happening.";
  if (grade === 'C')  return "Developing. This is a great time to focus on the growth areas.";
  if (grade === 'C-') return "Room to grow. Every assessment completed brings more clarity.";
  if (grade.startsWith('D')) return "Early stages. The insights here are your roadmap forward.";
  return "Starting point. Growth begins with awareness — you're here, that counts.";
}

export default function RelationshipGrade() {
  const [, navigate] = useLocation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/harmony/relationship-grade'],
    queryFn: () =>
      fetch('/api/harmony/relationship-grade', { credentials: 'include' }).then(r => r.json()),
  });

  const colors = data ? gradeColor(data.grade) : { text: 'text-amber-400', bg: 'from-amber-500 to-orange-500', ring: 'ring-amber-400/40' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/harmony-hub')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Relationship Grade Report</h1>
            <p className="text-xs text-white/50">Computed from your completed assessments</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : data?.error ? (
          <div className="text-center py-20 text-white/50">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-orange-400" />
            <p>Could not compute grade. Please try again.</p>
            <Button onClick={() => refetch()} className="mt-4 bg-white/10">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Partial data notice */}
            {data?.isPartial && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
              >
                <Info className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-amber-200 text-sm font-medium">Grade based on {data.testsCompleted} / {data.maxTests} assessments</p>
                  <p className="text-amber-200/70 text-xs mt-0.5">Complete more assessments for a more accurate grade. Head to Optional Tests to take them.</p>
                  <button onClick={() => navigate('/optional-tests')} className="text-amber-400 text-xs mt-1 underline">Take more assessments →</button>
                </div>
              </motion.div>
            )}

            {/* Grade Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 text-center`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-10`} />
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${colors.bg} ${colors.ring} ring-4 mb-4 mx-auto shadow-2xl`}>
                  <span className="text-5xl font-black text-white">{data?.grade || '—'}</span>
                </div>
                <p className={`text-4xl font-bold ${colors.text} mb-1`}>{data?.score ?? '—'}<span className="text-lg text-white/40">/100</span></p>
                <p className="text-white/70 text-sm mt-2 max-w-xs mx-auto">{data ? gradeMessage(data.grade) : ''}</p>
                <div className="mt-4">
                  <Progress value={data?.score ?? 0} className="h-2 bg-white/10" />
                </div>
                <p className="text-white/30 text-xs mt-2">{data?.testsCompleted} of {data?.maxTests} assessments completed</p>
              </div>
            </motion.div>

            {/* Strengths */}
            {data?.strengths?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-emerald-300 font-semibold">Your Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {data.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <Star className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Growth areas */}
            {data?.growth?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-amber-300 font-semibold">Growth Opportunities</h3>
                </div>
                <ul className="space-y-2">
                  {data.growth.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Insights */}
            {data?.insights?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-indigo-500/10 border border-indigo-500/25 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-indigo-300 font-semibold">Assessment Insights</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.insights.map((ins: string, i: number) => (
                    <Badge key={i} className="bg-indigo-500/20 text-indigo-200 border-0 text-xs">{ins}</Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-3"
            >
              <Button
                onClick={() => navigate('/optional-tests')}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl"
              >
                <Brain className="w-4 h-4 mr-2" /> Take Assessments
              </Button>
              <Button
                onClick={() => navigate('/harmony-pro')}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-xl"
              >
                <Heart className="w-4 h-4 mr-2" /> Talk to Coach
              </Button>
            </motion.div>

            <p className="text-white/25 text-xs text-center pb-4">
              Grade updates automatically as you complete more assessments. For informational purposes only.
            </p>
          </div>
        )}
      </div>
      <CrisisBanner />
    </div>
  );
}
