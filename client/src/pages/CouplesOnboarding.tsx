import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Heart, Users, Copy, Check, ArrowRight, Loader2, Sparkles, Calendar, MessageSquare, Target } from 'lucide-react';

type Step = 'choose' | 'create-profile' | 'join' | 'done';

export default function CouplesOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('choose');
  const [codeCopied, setCodeCopied] = useState(false);

  const [form, setForm] = useState({
    partnerName: '',
    anniversary: '',
    favoriteMemory: '',
    therapyGoals: '',
  });

  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const { data: userData } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });

  const { data: existingProfile, isLoading: checkingProfile } = useQuery<any>({
    queryKey: ['/api/couples/profile/me'],
    retry: false,
  });

  useEffect(() => {
    if (existingProfile?.id) {
      navigate('/harmony-hub');
    }
  }, [existingProfile, navigate]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/couples/profile/create', {
        partner1Name: userData?.firstName || userData?.fullName || 'Partner 1',
        partner2Name: form.partnerName,
        anniversary: form.anniversary,
        favoriteMemory: form.favoriteMemory,
        therapyGoals: form.therapyGoals,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.coupleCode);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create couple profile.',
        variant: 'destructive',
      });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/couples/profile/join', {
        coupleCode: joinCode.toUpperCase().trim(),
        partnerName: userData?.firstName || userData?.fullName || 'Partner 2',
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Joined!', description: 'Welcome to your couples journey.' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      navigate('/harmony-hub');
    },
    onError: (err: any) => {
      toast({
        title: 'Invalid Code',
        description: err.message || 'That code wasn\'t found. Check with your partner.',
        variant: 'destructive',
      });
    },
  });

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-violet-950/30 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💑</div>
          <h1 className="text-3xl font-bold text-white">Couples Setup</h1>
          <p className="text-slate-400 mt-2">Connect with your partner to begin your journey together</p>
        </div>

        {step === 'choose' && (
          <div className="grid gap-4">
            <Card
              className="bg-slate-800/60 border-violet-500/30 hover:border-violet-400 cursor-pointer transition-all hover:-translate-y-0.5"
              onClick={() => setStep('create-profile')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">I'm setting us up</h3>
                    <p className="text-slate-400 text-sm">Create your couple profile and get a code to share with your partner.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-violet-400 self-center" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="bg-slate-800/60 border-teal-500/30 hover:border-teal-400 cursor-pointer transition-all hover:-translate-y-0.5"
              onClick={() => setStep('join')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">My partner shared a code</h3>
                    <p className="text-slate-400 text-sm">Enter the code your partner gave you to join your couple's profile.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-teal-400 self-center" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'create-profile' && (
          <Card className="bg-slate-800/60 border-violet-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Your Couple Profile
              </CardTitle>
              <p className="text-slate-400 text-sm">Tell us about your relationship so our AI coach can support you both.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  Partner's name
                </Label>
                <Input
                  placeholder="Your partner's first name"
                  value={form.partnerName}
                  onChange={e => setForm(f => ({ ...f, partnerName: e.target.value }))}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Anniversary date <span className="text-slate-500 text-xs font-normal ml-1">(optional)</span>
                </Label>
                <Input
                  type="date"
                  value={form.anniversary}
                  onChange={e => setForm(f => ({ ...f, anniversary: e.target.value }))}
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  A favorite memory together <span className="text-slate-500 text-xs font-normal ml-1">(optional)</span>
                </Label>
                <Textarea
                  placeholder="e.g. The road trip when we got lost and found that hidden waterfall..."
                  value={form.favoriteMemory}
                  onChange={e => setForm(f => ({ ...f, favoriteMemory: e.target.value }))}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  What do you want from couples coaching? <span className="text-slate-500 text-xs font-normal ml-1">(optional)</span>
                </Label>
                <Textarea
                  placeholder="e.g. Better communication, rebuilding trust, preparing for marriage..."
                  value={form.therapyGoals}
                  onChange={e => setForm(f => ({ ...f, therapyGoals: e.target.value }))}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('choose')}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-semibold"
                  onClick={() => createMutation.mutate()}
                  disabled={!form.partnerName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <>Create Our Profile <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'join' && (
          <Card className="bg-slate-800/60 border-teal-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-400" />
                Enter Your Couple Code
              </CardTitle>
              <p className="text-slate-400 text-sm">Your partner created the profile. Enter their code to link up.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white">Couple Code</Label>
                <Input
                  placeholder="e.g. LOVE-4821"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-slate-900/50 border-slate-600 text-white text-center text-xl font-mono tracking-widest placeholder:text-slate-600 uppercase"
                  maxLength={12}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('choose')}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinCode.trim().length < 4 || joinMutation.isPending}
                >
                  {joinMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining...</>
                  ) : (
                    <>Join Our Profile <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card className="bg-slate-800/60 border-violet-500/30 text-center">
            <CardContent className="p-8 space-y-6">
              <div className="text-6xl">💕</div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Couple Profile Created!</h2>
                <p className="text-slate-400">Share this code with your partner so they can join:</p>
              </div>

              <div className="bg-slate-900/60 border border-violet-500/40 rounded-2xl p-6">
                <div className="text-3xl font-mono font-bold text-violet-300 tracking-widest mb-3">
                  {generatedCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyCode}
                  className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20"
                >
                  {codeCopied ? (
                    <><Check className="w-4 h-4 mr-2" /> Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy Code</>
                  )}
                </Button>
              </div>

              <p className="text-slate-500 text-sm">
                Your partner can sign up and enter this code during their Couples Setup to link your profiles.
              </p>

              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-semibold py-3"
                onClick={() => navigate('/harmony-hub')}
              >
                Enter Harmony Hub <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
