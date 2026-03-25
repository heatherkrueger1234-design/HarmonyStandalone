import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, Heart, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CouplesPaymentSuccess() {
  const [, setLocation] = useLocation();
  const [therapyId, setTherapyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    const tid = params.get('therapy_id');
    if (sid && tid) { setSessionId(sid); setTherapyId(tid); }
  }, []);

  const { data: paymentVerification, isLoading } = useQuery({
    queryKey: ['/api/couples/payment-verify', sessionId, therapyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/couples/payment-verify?session_id=${sessionId}&therapy_id=${therapyId}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Payment verification failed');
      return response.json();
    },
    enabled: !!sessionId && !!therapyId,
  });

  useEffect(() => {
    if (paymentVerification?.success && therapyId) {
      const cd = setInterval(() => setCountdown(n => n - 1), 1000);
      const timer = setTimeout(() => {
        setLocation(`/couples-assessment?therapyId=${therapyId}`);
      }, 5000);
      return () => { clearTimeout(timer); clearInterval(cd); };
    }
  }, [paymentVerification, therapyId, setLocation]);

  const darkBg = { background: 'linear-gradient(160deg,#0d0618 0%,#130b22 50%,#0d1a1a 100%)' };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={darkBg}>
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-rose-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full border-4 border-t-rose-400 border-rose-500/20 animate-spin" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Verifying your payment</p>
            <p className="text-white/30 text-sm mt-1">One moment while we confirm everything...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentVerification?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={darkBg}>
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 className="text-white font-black text-2xl mb-2">Payment Verification Failed</h2>
            <p className="text-white/45 text-sm leading-relaxed max-w-sm mx-auto">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => setLocation('/couples-onboarding')}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}
              data-testid="button-try-again">
              Try Again
            </button>
            <a href="mailto:support@syncwithinsight.com"
              className="block text-center text-white/30 hover:text-white/55 text-sm transition-colors py-2">
              Contact support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={darkBg}>
      {/* Atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle,rgba(244,63,94,0.12),rgba(168,85,247,0.08),transparent)' }} />
      </div>

      <div className="relative w-full max-w-md space-y-8 text-center">
        {/* Success mark */}
        <div className="relative mx-auto w-28 h-28">
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(244,63,94,0.08)', animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full animate-ping"
            style={{ background: 'rgba(168,85,247,0.06)', animationDuration: '2s', animationDelay: '0.5s' }} />
          {/* Icon */}
          <div className="relative w-28 h-28 rounded-full flex items-center justify-center border border-rose-400/20"
            style={{
              background: 'linear-gradient(135deg,rgba(244,63,94,0.20),rgba(168,85,247,0.15))',
              boxShadow: '0 0 40px rgba(244,63,94,0.25), 0 0 80px rgba(168,85,247,0.15)',
            }}>
            <CheckCircle className="w-12 h-12 text-rose-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-white/20">Harmony</span>
            <Heart className="w-3 h-3 text-rose-400/60" />
            <span className="text-[10px] font-black tracking-[0.25em] uppercase text-white/20">Unlocked</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome to Harmony</h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
            Your couples coaching journey begins now. AI-powered insights built for the two of you.
          </p>
        </div>

        {/* What's unlocked */}
        <div className="rounded-2xl p-5 text-left space-y-3 border border-rose-400/15"
          style={{ background: 'rgba(244,63,94,0.06)' }}>
          {[
            { icon: '🧠', label: 'AMBI-81 couples compatibility analysis' },
            { icon: '💬', label: 'AI relationship coach — available 24/7' },
            { icon: '🎯', label: 'Personalized growth plans for both partners' },
            { icon: '📊', label: 'Relationship health scores & insights' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-base w-6 text-center">{icon}</span>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Countdown redirect */}
        <div className="space-y-3">
          <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${((5 - countdown) / 5) * 100}%`,
                background: 'linear-gradient(90deg,#f43f5e,#a855f7)'
              }} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-white/20 animate-spin" />
            <p className="text-white/25 text-xs">
              Starting your assessment in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>

        {/* Manual CTA */}
        <button
          onClick={() => therapyId && setLocation(`/couples-assessment?therapyId=${therapyId}`)}
          className="flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-semibold mx-auto transition-colors">
          Start assessment now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
