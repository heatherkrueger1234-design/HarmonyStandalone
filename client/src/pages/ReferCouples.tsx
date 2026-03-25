import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Heart, Copy, Share2, CheckCircle2, Gift, Users, Star,
  ArrowLeft, Sparkles, Crown, Calendar, Link2, MessageCircle,
  Twitter, ChevronRight, PartyPopper, Infinity
} from 'lucide-react';

interface ReferralStatus {
  referralCode: string;
  referralLink: string;
  coupleReferralCount: number;
  couplesNeeded: number;
  progress: number;
  cyclesCompleted: number;
  rewardGranted: boolean;
  bonusUntil: string | null;
  isBonusActive: boolean;
}

function ProgressRing({ progress, total }: { progress: number; total: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(progress / total, 1);
  const dash = pct * circumference;
  return (
    <svg width="130" height="130" className="rotate-[-90deg]">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      <motion.circle
        cx="65" cy="65" r={radius} fill="none"
        stroke="url(#ringGrad)" strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - dash }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CoupleSlot({ index, filled }: { index: number; filled: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-500 ${
        filled
          ? 'border-pink-500/40 bg-gradient-to-b from-pink-500/10 to-purple-500/10'
          : 'border-white/10 bg-white/[0.02]'
      }`}
    >
      <div className={`relative flex items-center justify-center w-14 h-14 rounded-full ${
        filled ? 'bg-gradient-to-br from-pink-500 to-purple-600' : 'bg-white/[0.05] border border-white/10'
      }`}>
        {filled ? (
          <Heart className="w-6 h-6 text-white fill-white" />
        ) : (
          <span className="text-white/20 text-xl font-light">?</span>
        )}
        {filled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </div>
      <span className={`text-xs font-medium ${filled ? 'text-pink-300' : 'text-white/30'}`}>
        {filled ? 'Couple linked!' : `Couple ${index + 1}`}
      </span>
    </motion.div>
  );
}

export default function ReferCouples() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery<ReferralStatus>({
    queryKey: ['/api/referrals/couples-status'],
    enabled: !!user,
  });

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
    } catch {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Please copy the link manually.' });
    }
  };

  const shareText = `💑 I use SyncWithInsight to keep my relationship healthy — it's incredible! Use my link to join the Harmony coaching side together and help me earn a free month. ${status?.referralLink ?? ''}`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank');
  };

  const progress = status?.progress ?? 0;
  const total = status?.couplesNeeded ?? 3;
  const cycles = status?.cyclesCompleted ?? 0;
  const bonusUntilDate = status?.bonusUntil ? new Date(status.bonusUntil) : null;
  const rewardEarned = cycles > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-gray-900 to-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/eros-hub')}
            className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-white">Refer Couples</h1>
            <p className="text-xs text-white/40">Refer 3 couples → get 1 free month</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-900/30 via-purple-900/20 to-slate-900/50 p-6 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(236,72,153,0.12),transparent_60%)]" />
          <div className="relative">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Share the love, get rewarded</h2>
            <p className="text-white/60 text-sm max-w-sm mx-auto">
              Refer 3 couples to the Harmony coaching side and we'll give you <span className="text-pink-400 font-semibold">1 free month</span> on your subscription. Keep going — every 3 more couples earns another!
            </p>
          </div>
        </motion.div>

        {/* Progress section */}
        {isLoading ? (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse h-48" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6"
          >
            <div className="flex items-center gap-6">
              {/* Ring */}
              <div className="relative flex-shrink-0 flex items-center justify-center">
                <ProgressRing progress={progress} total={total} />
                <div className="absolute text-center">
                  <span className="text-3xl font-bold text-white">{progress}</span>
                  <span className="text-white/40 text-xs block">of {total}</span>
                </div>
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-white/60 text-sm mb-1">Couples referred this round</p>
                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-2xl font-bold text-white">{progress}</span>
                  <span className="text-white/30">/ {total} couples</span>
                </div>
                {progress < total ? (
                  <p className="text-pink-300 text-sm font-medium">
                    {total - progress} more couple{total - progress !== 1 ? 's' : ''} until your free month! 🎁
                  </p>
                ) : (
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
                    <PartyPopper className="w-4 h-4" /> Free month earned!
                  </p>
                )}
                {cycles > 0 && (
                  <Badge className="mt-2 bg-purple-500/15 text-purple-300 border-purple-500/20 border text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    {cycles} free month{cycles !== 1 ? 's' : ''} earned total
                  </Badge>
                )}
              </div>
            </div>

            {/* Couple slots */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[0, 1, 2].map(i => (
                <CoupleSlot key={i} index={i} filled={i < progress} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Active bonus banner */}
        <AnimatePresence>
          {status?.isBonusActive && bonusUntilDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-300 font-semibold text-sm">Free month is active!</p>
                <p className="text-emerald-400/70 text-xs">
                  Your bonus subscription runs until{' '}
                  <span className="text-emerald-300 font-medium">
                    {bonusUntilDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Referral link */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Your referral link</span>
          </div>

          {/* Code display */}
          {status?.referralCode && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <span className="text-white/40 text-xs">Code:</span>
              <span className="text-pink-300 font-mono text-sm font-bold tracking-wider flex-1">{status.referralCode}</span>
            </div>
          )}

          {/* Link + copy */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-hidden">
              <p className="text-white/50 text-xs truncate">{status?.referralLink ?? '…'}</p>
            </div>
            <Button
              onClick={() => handleCopy(status?.referralLink ?? '')}
              size="sm"
              className={`flex-shrink-0 transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-white/50">WhatsApp</span>
            </button>
            <button
              onClick={shareTwitter}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              <Twitter className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-white/50">Twitter/X</span>
            </button>
            <button
              onClick={shareSMS}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
            >
              <Share2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-white/50">Text/SMS</span>
            </button>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">How it works</span>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: <Share2 className="w-4 h-4 text-pink-400" />,
                title: 'Share your link',
                desc: 'Send your unique referral link to couples you know.',
              },
              {
                icon: <Users className="w-4 h-4 text-purple-400" />,
                title: 'Both partners sign up',
                desc: 'Each person in the couple creates an account using your link.',
              },
              {
                icon: <Heart className="w-4 h-4 text-rose-400" />,
                title: 'They link as a couple',
                desc: 'They connect on the Harmony coaching side — that\'s 1 couple counted.',
              },
              {
                icon: <Gift className="w-4 h-4 text-amber-400" />,
                title: 'Reach 3 couples → free month',
                desc: 'Your subscription is extended by 30 days automatically. No codes needed.',
              },
              {
                icon: <Infinity className="w-4 h-4 text-emerald-400" />,
                title: 'Keep going for more',
                desc: 'Every 3 additional couples earns you another free month.',
              },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{step.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Total stats if earned any */}
        {rewardEarned && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-slate-900/50 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Your referral rewards</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                <p className="text-2xl font-bold text-pink-400">{status?.coupleReferralCount ?? 0}</p>
                <p className="text-white/50 text-xs mt-0.5">Couples referred</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
                <p className="text-2xl font-bold text-purple-400">{cycles}</p>
                <p className="text-white/50 text-xs mt-0.5">Free months earned</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA to Harmony Hub */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <button
            onClick={() => navigate('/harmony-hub')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Heart className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-white text-sm font-medium">Open Harmony Hub</p>
                <p className="text-white/40 text-xs">Your couples coaching dashboard</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </button>
        </motion.div>

        <div className="h-6" />
      </div>
    </div>
  );
}
