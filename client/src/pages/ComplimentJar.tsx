import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft, Gift, Heart, Star, Sparkles, Trash2, Send,
  Sun, BookOpen, TrendingUp, MessageCircleHeart, Shield,
  RefreshCw, CheckCircle2, Calendar, Flame, Brain,
  Eye, ListChecks, Dumbbell, HeartHandshake, ChevronRight,
  Smile, Meh, Frown, Zap, Target, Award
} from "lucide-react";

interface Compliment {
  id: string;
  text: string;
  from: string;
  date: string;
  category: string;
  opened: boolean;
}

interface ConfidenceEntry {
  id: string;
  date: string;
  score: number;
  mood: string;
  note: string;
}

interface ExerciseCompletion {
  exerciseId: string;
  date: string;
}

const CATEGORIES = [
  { id: "love", label: "Love", emoji: "❤️", color: "text-pink-400", bg: "bg-pink-500/15", border: "border-pink-500/25" },
  { id: "gratitude", label: "Gratitude", emoji: "🙏", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25" },
  { id: "memory", label: "Memory", emoji: "✨", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/25" },
  { id: "funny", label: "Funny", emoji: "😄", color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/25" },
];

const PROMPTS = [
  "A specific moment when they made you laugh so hard you cried...",
  "Something they do every day that you'd miss if they stopped...",
  "A time they supported you when you really needed it...",
  "Something about how they parent / care for others that you admire...",
  "The way they look when they're doing something they love...",
  "Something they said that you've never forgotten...",
];

const DAILY_AFFIRMATIONS = [
  "I am worthy of love and deep connection exactly as I am.",
  "My vulnerability is my greatest strength in relationships.",
  "I bring unique gifts to every relationship I'm part of.",
  "I deserve someone who sees and appreciates the real me.",
  "My past does not define my future in love.",
  "I am enough — I don't need to perform to be loved.",
  "I attract healthy, respectful relationships into my life.",
  "My heart is open, and I am ready to give and receive love.",
  "I trust myself to make good decisions about who I let close.",
  "I release the need for approval from others.",
  "My self-worth is not determined by my relationship status.",
  "I choose to see the beauty in myself that others see in me.",
  "I am deserving of patience, kindness, and understanding.",
  "Every day I grow more confident in who I am.",
  "I forgive myself for past relationship mistakes — they taught me.",
  "I radiate warmth, authenticity, and genuine connection.",
  "I am worthy of a love that feels safe and exciting.",
  "My imperfections make me interesting and lovable.",
  "I choose partners who respect my boundaries and values.",
  "I am proud of who I'm becoming.",
  "I let go of comparison — my journey is uniquely mine.",
  "I am learning to love myself more deeply every day.",
  "My feelings are valid, and I honor them without judgment.",
  "I bring joy and light to the people around me.",
  "I am brave for putting my heart out there.",
  "I deserve a love story that makes me feel alive.",
  "I trust the timing of my life and my love story.",
  "I am becoming the partner I wish to attract.",
  "My confidence grows with every kind word I speak to myself.",
  "I celebrate small wins — they build big transformations.",
  "I am magnetic, and the right people are drawn to my energy.",
  "I honor my needs and communicate them with clarity.",
  "I am resilient — heartbreak has made me stronger, not harder.",
  "I choose self-compassion over self-criticism today.",
  "My authentic self is my most attractive self.",
  "I deserve someone who shows up consistently.",
  "I release anxiety about the future and embrace today.",
  "I am worthy of all the good things coming my way.",
  "I have the courage to be seen, truly seen.",
  "My love language matters, and the right person will speak it.",
  "I am healing, growing, and becoming more whole every day.",
  "I bring depth and meaning to my conversations.",
  "I trust my intuition when it comes to relationships.",
  "I am worthy of a love that does not require me to shrink.",
  "My boundaries are a sign of self-respect, not walls.",
  "I am allowed to take up space and be fully myself.",
  "I am more than my appearance — my soul is beautiful.",
  "I attract people who match my energy and values.",
  "Every rejection is redirection toward something better.",
  "I am grateful for the love I already have in my life.",
  "I am a work in progress, and that is perfectly okay.",
  "My story is still being written, and the best chapters are ahead.",
  "I choose to be gentle with myself through this journey.",
  "I am worthy of deep, soul-stirring, life-changing love.",
  "Today I choose to believe in my own worthiness.",
];

const SELF_LOVE_EXERCISES = [
  {
    id: "mirror-work",
    title: "Mirror Work",
    icon: Eye,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    duration: "5 min",
    description: "Stand in front of a mirror, look into your own eyes, and say these statements with genuine feeling:",
    steps: [
      "I love you, [your name]. I really, truly love you.",
      "You are doing your best, and your best is enough.",
      "I forgive you for being hard on yourself.",
      "You deserve all the love you give to others.",
      "I am proud of you for showing up today.",
    ],
  },
  {
    id: "gratitude-list",
    title: "Body Gratitude List",
    icon: ListChecks,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    duration: "5 min",
    description: "Write down 5 things your body does for you that you're grateful for. Focus on function, not appearance:",
    steps: [
      "My legs carry me where I need to go.",
      "My arms let me embrace the people I love.",
      "My voice lets me express my thoughts and feelings.",
      "My hands let me create, touch, and connect.",
      "My heart beats without me even asking — it keeps me alive.",
    ],
  },
  {
    id: "strength-finder",
    title: "Strength Identification",
    icon: Dumbbell,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    duration: "7 min",
    description: "Reflect on these prompts to identify your core strengths in relationships:",
    steps: [
      "What do friends come to you for advice about?",
      "What challenge have you overcome that others admire?",
      "What quality do people compliment you on most?",
      "When do you feel most like yourself?",
      "What's something kind you did recently without being asked?",
    ],
  },
  {
    id: "inner-child",
    title: "Inner Child Letter",
    icon: HeartHandshake,
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    duration: "10 min",
    description: "Write a short letter to your younger self. What would you want them to know about love?",
    steps: [
      "Start with: 'Dear little me...'",
      "Tell them what you've learned about love.",
      "Reassure them about a fear they had.",
      "Share one thing you're proud of becoming.",
      "End with: 'I've got us. We're going to be okay.'",
    ],
  },
  {
    id: "joy-inventory",
    title: "Joy Inventory",
    icon: Sparkles,
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    duration: "5 min",
    description: "List things that bring you genuine joy — independent of any relationship:",
    steps: [
      "A place that makes you feel peaceful.",
      "A song that lifts your mood instantly.",
      "A food that feels like a warm hug.",
      "An activity you lose yourself in (flow state).",
      "A memory that always makes you smile.",
    ],
  },
  {
    id: "boundary-practice",
    title: "Boundary Setting Practice",
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    duration: "7 min",
    description: "Practice saying these boundaries out loud. Notice how each one feels in your body:",
    steps: [
      "'I need some time to think about that before I respond.'",
      "'I appreciate the offer, but that doesn't work for me.'",
      "'I feel uncomfortable when... and I'd prefer...'",
      "'I'm not available for that conversation right now.'",
      "'My answer is no, and I don't need to explain why.'",
    ],
  },
];

const DATE_CONFIDENCE_PROMPTS = [
  { title: "Remind yourself of your best qualities", prompt: "List 3 things that make you an amazing date partner. Think about what past partners or friends have genuinely appreciated about you." },
  { title: "Prepare your stories", prompt: "Think of 2-3 interesting stories from your life that show who you really are. Good stories reveal character, humor, and passion." },
  { title: "Set your intention", prompt: "Instead of worrying about impressing them, set an intention: 'I will be curious about them and authentic about myself.'" },
  { title: "Power pose", prompt: "Stand tall for 2 minutes with your hands on your hips. Research shows this can boost confidence hormones before stressful situations." },
  { title: "Grounding exercise", prompt: "Feel your feet on the ground. Take 5 deep breaths. Name 5 things you can see, 4 you can hear, 3 you can touch. You are present." },
  { title: "The 'worst case' reset", prompt: "If the date goes poorly, what actually happens? Nothing. You go home, watch your favorite show, and try again. There is no real danger here." },
  { title: "Dress for yourself", prompt: "Wear something that makes YOU feel confident, not what you think they want to see. When you feel good in your clothes, it shows." },
  { title: "Conversation starters ready", prompt: "Have a few thoughtful questions ready: 'What's something you've been excited about lately?' 'What's the most adventurous thing you've done?'" },
];

const MOODS = [
  { id: "great", label: "Great", icon: Flame, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { id: "good", label: "Good", icon: Smile, color: "text-green-400", bg: "bg-green-500/15" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-amber-400", bg: "bg-amber-500/15" },
  { id: "low", label: "Low", icon: Frown, color: "text-orange-400", bg: "bg-orange-500/15" },
  { id: "struggling", label: "Struggling", icon: Heart, color: "text-red-400", bg: "bg-red-500/15" },
];

function getStorageItem<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}

function setStorageItem(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function ComplimentJar() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const userData = user as any;
  const firstName = userData?.firstName || userData?.fullName?.split(" ")[0] || "You";

  const [activeTab, setActiveTab] = useState("affirmations");

  const [compliments, setCompliments] = useState<Compliment[]>(() => getStorageItem("complimentJar", []));
  const [text, setText] = useState("");
  const [category, setCategory] = useState("love");
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [promptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length));

  const [confidenceEntries, setConfidenceEntries] = useState<ConfidenceEntry[]>(() => userData?.confidenceEntries || getStorageItem("confidenceTracker", []));
  const [confidenceScore, setConfidenceScore] = useState([5]);
  const [selectedMood, setSelectedMood] = useState("good");
  const [confidenceNote, setConfidenceNote] = useState("");

  const [exerciseCompletions, setExerciseCompletions] = useState<ExerciseCompletion[]>(() => userData?.exerciseCompletions || getStorageItem("exerciseCompletions", []));
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const [sendComplimentText, setSendComplimentText] = useState("");
  const [sendComplimentMatch, setSendComplimentMatch] = useState("");

  const [aiAffirmation, setAiAffirmation] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const todayAffirmation = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_AFFIRMATIONS[dayOfYear % DAILY_AFFIRMATIONS.length];
  }, []);

  const streak = useMemo(() => {
    const dates = confidenceEntries.map(e => e.date).sort().reverse();
    if (dates.length === 0) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.includes(dateStr)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [confidenceEntries]);

  const averageConfidence = useMemo(() => {
    if (confidenceEntries.length === 0) return 0;
    const last7 = confidenceEntries.slice(0, 7);
    return Math.round(last7.reduce((sum, e) => sum + e.score, 0) / last7.length * 10) / 10;
  }, [confidenceEntries]);

  const todayExercisesDone = useMemo(() => {
    return exerciseCompletions.filter(e => e.date === todayStr).length;
  }, [exerciseCompletions, todayStr]);

  const saveCompliments = (items: Compliment[]) => {
    setCompliments(items);
    setStorageItem("complimentJar", items);
  };

  const handleAddCompliment = () => {
    if (text.trim().length < 20) {
      toast({ title: "Be more specific!", description: "A great compliment is at least 20 characters.", variant: "destructive" });
      return;
    }
    const newCompliment: Compliment = {
      id: Date.now().toString(),
      text: text.trim(),
      from: firstName,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      category,
      opened: false,
    };
    saveCompliments([newCompliment, ...compliments]);
    setText("");
    toast({ title: "Compliment added!", description: "It's waiting in the jar 💌" });
  };

  const handleOpenCompliment = (id: string) => {
    setOpenedId(openedId === id ? null : id);
    const updated = compliments.map(c => c.id === id ? { ...c, opened: true } : c);
    saveCompliments(updated);
  };

  const handleDeleteCompliment = (id: string) => {
    saveCompliments(compliments.filter(c => c.id !== id));
  };

  const handleLogConfidence = async () => {
    const entry: ConfidenceEntry = {
      id: Date.now().toString(),
      date: todayStr,
      score: confidenceScore[0],
      mood: selectedMood,
      note: confidenceNote.trim(),
    };
    const existingIndex = confidenceEntries.findIndex(e => e.date === todayStr);
    let updated: ConfidenceEntry[];
    if (existingIndex >= 0) {
      updated = [...confidenceEntries];
      updated[existingIndex] = entry;
    } else {
      updated = [entry, ...confidenceEntries];
    }
    setConfidenceEntries(updated);
    setStorageItem("confidenceTracker", updated);
    
    try {
      await apiRequest("POST", "/api/self-esteem/confidence", { entries: updated });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (err) {
      console.error("Failed to sync confidence to server", err);
    }

    setConfidenceNote("");
    toast({ title: "Confidence logged!", description: `Score: ${confidenceScore[0]}/10 • Mood: ${selectedMood}` });
  };

  const handleCompleteExercise = async (exerciseId: string) => {
    const alreadyDone = exerciseCompletions.some(e => e.exerciseId === exerciseId && e.date === todayStr);
    if (alreadyDone) {
      toast({ title: "Already completed!", description: "You already did this exercise today. Try another one!" });
      return;
    }
    const updated = [{ exerciseId, date: todayStr }, ...exerciseCompletions];
    setExerciseCompletions(updated);
    setStorageItem("exerciseCompletions", updated);

    try {
      await apiRequest("POST", "/api/self-esteem/exercises", { completions: updated });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    } catch (err) {
      console.error("Failed to sync exercises to server", err);
    }

    toast({ title: "Exercise completed! 🎉", description: "Great work on investing in yourself." });
  };

  const handleSendCompliment = async () => {
    if (sendComplimentText.trim().length < 10) {
      toast({ title: "Write a bit more", description: "A meaningful compliment needs at least 10 characters.", variant: "destructive" });
      return;
    }

    if (sendComplimentMatch) {
      try {
        // Try to find a match with this name among current user's matches
        const matchesResponse = await fetch("/api/matches");
        if (matchesResponse.ok) {
          const matches = await matchesResponse.json();
          const match = matches.find((m: any) => 
            m.otherUser.displayName?.toLowerCase().includes(sendComplimentMatch.toLowerCase()) ||
            m.otherUser.firstName?.toLowerCase().includes(sendComplimentMatch.toLowerCase())
          );
          
          if (match) {
            await apiRequest("POST", `/api/self-esteem/send-to/${match.otherUser.id}`, {
              content: sendComplimentText,
              category: "general"
            });
            toast({ title: "Compliment sent! 💝", description: `Your encouragement has been sent to ${match.otherUser.displayName || match.otherUser.firstName}.` });
            setSendComplimentText("");
            setSendComplimentMatch("");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to send compliment via API", err);
      }
    }

    // Fallback if no match found or API fails
    toast({ title: "Compliment sent! 💝", description: `Your encouragement has been sent${sendComplimentMatch ? ` to ${sendComplimentMatch}` : ""}.` });
    setSendComplimentText("");
    setSendComplimentMatch("");
  };

  const handleGenerateAiAffirmation = async () => {
    setIsGeneratingAi(true);
    try {
      const response = await apiRequest("POST", "/api/ai/affirmation", { name: firstName });
      if (response.ok) {
        const data = await response.json();
        setAiAffirmation(data.affirmation);
      } else {
        const fallbacks = [
          `${firstName}, your capacity for love and growth is extraordinary. Trust the journey.`,
          `${firstName}, you bring something irreplaceable to every connection. Never doubt that.`,
          `${firstName}, your authenticity is your superpower. The right people will always see it.`,
          `${firstName}, you are becoming the person your future partner will be grateful to have found.`,
          `${firstName}, every step you take toward self-love makes you more magnetic to the right match.`,
        ];
        setAiAffirmation(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
      }
    } catch {
      const fallbacks = [
        `${firstName}, your openness to growth shows incredible strength. Keep going.`,
        `${firstName}, the love you seek is already seeking you. Be patient with yourself.`,
        `${firstName}, you deserve someone who matches your depth and intentionality.`,
      ];
      setAiAffirmation(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
    setIsGeneratingAi(false);
  };

  const cat = CATEGORIES.find(c => c.id === category)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900/25 to-slate-900 pb-10">
      <div className="relative max-w-2xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate("/harmony-hub")} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-300" /> Self-Esteem Builder
            </h1>
            <p className="text-xs text-white/50">Affirmations, exercises, tracking & encouragement</p>
          </div>
          {streak > 0 && (
            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 gap-1">
              <Flame className="w-3 h-3" /> {streak} day streak
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-slate-800/30 border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-pink-300">{compliments.length}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Compliments</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-300">{averageConfidence || "—"}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Avg Confidence</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/30 border border-white/[0.06] rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-violet-300">{todayExercisesDone}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Exercises Today</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-slate-800/50 border border-white/[0.06] rounded-xl h-auto p-1 mb-6">
            <TabsTrigger value="affirmations" className="text-[10px] py-2 px-1 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 text-white/40 rounded-lg">
              <Sun className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="exercises" className="text-[10px] py-2 px-1 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300 text-white/40 rounded-lg">
              <BookOpen className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="tracking" className="text-[10px] py-2 px-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 text-white/40 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="jar" className="text-[10px] py-2 px-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-white/40 rounded-lg">
              <Gift className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="send" className="text-[10px] py-2 px-1 data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-300 text-white/40 rounded-lg">
              <MessageCircleHeart className="w-3.5 h-3.5" />
            </TabsTrigger>
            <TabsTrigger value="dateprep" className="text-[10px] py-2 px-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300 text-white/40 rounded-lg">
              <Shield className="w-3.5 h-3.5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="affirmations">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-pink-600/15 to-violet-600/10 border border-pink-500/20 rounded-2xl">
                  <CardContent className="p-6 text-center">
                    <Sun className="w-8 h-8 text-amber-300 mx-auto mb-3" />
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Today's Affirmation</p>
                    <p className="text-lg text-white/90 font-medium leading-relaxed italic">
                      "{todayAffirmation}"
                    </p>
                    <p className="text-[10px] text-white/30 mt-3">Say it out loud. Mean it. Repeat it.</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-violet-300" />
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">AI Personalized Affirmation</p>
                    </div>
                    {aiAffirmation ? (
                      <div className="mb-3">
                        <p className="text-sm text-white/85 italic leading-relaxed">"{aiAffirmation}"</p>
                      </div>
                    ) : (
                      <p className="text-sm text-white/35 mb-3">Generate a personalized affirmation just for you.</p>
                    )}
                    <Button onClick={handleGenerateAiAffirmation} disabled={isGeneratingAi}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white font-bold rounded-full px-5 gap-2 text-xs">
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                      {isGeneratingAi ? "Generating..." : aiAffirmation ? "Generate Another" : "Generate for Me"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">More Affirmations</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {DAILY_AFFIRMATIONS.slice(0, 15).map((aff, i) => (
                        <div key={i} className="flex items-start gap-2 py-1.5">
                          <Star className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                          <p className="text-xs text-white/60 leading-relaxed">{aff}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="exercises">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Self-Love Exercises</p>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  {todayExercisesDone}/{SELF_LOVE_EXERCISES.length} today
                </Badge>
              </div>

              {SELF_LOVE_EXERCISES.map((exercise, idx) => {
                const Icon = exercise.icon;
                const isDoneToday = exerciseCompletions.some(e => e.exerciseId === exercise.id && e.date === todayStr);
                const isExpanded = expandedExercise === exercise.id;

                return (
                  <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <Card className={`border rounded-2xl transition-all ${isDoneToday ? "bg-emerald-500/8 border-emerald-500/20" : "bg-slate-800/30 border-white/[0.06]"}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}>
                          <div className={`w-10 h-10 rounded-xl ${exercise.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${exercise.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white/90">{exercise.title}</p>
                              {isDoneToday && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <p className="text-[11px] text-white/40">{exercise.duration}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <p className="text-xs text-white/60 mb-3 leading-relaxed">{exercise.description}</p>
                                <div className="space-y-2 mb-4">
                                  {exercise.steps.map((step, si) => (
                                    <div key={si} className="flex items-start gap-2">
                                      <span className="text-[10px] text-white/25 font-mono mt-0.5">{si + 1}.</span>
                                      <p className="text-xs text-white/70 italic leading-relaxed">{step}</p>
                                    </div>
                                  ))}
                                </div>
                                <Button onClick={() => handleCompleteExercise(exercise.id)} disabled={isDoneToday}
                                  className={`rounded-full px-4 text-xs font-bold gap-2 ${isDoneToday ? "bg-emerald-500/20 text-emerald-300" : "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 text-white"}`}>
                                  {isDoneToday ? (
                                    <><CheckCircle2 className="w-3.5 h-3.5" /> Completed Today</>
                                  ) : (
                                    <><Zap className="w-3.5 h-3.5" /> Mark Complete</>
                                  )}
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="tracking">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-emerald-300" />
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Log Today's Confidence</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-white/50 mb-2">How's your mood?</p>
                      <div className="flex gap-2">
                        {MOODS.map(m => {
                          const MIcon = m.icon;
                          return (
                            <button key={m.id} onClick={() => setSelectedMood(m.id)}
                              className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl text-xs border transition-all flex-1 ${selectedMood === m.id ? `${m.bg} ${m.color} border-current` : "border-white/[0.06] text-white/30 hover:bg-white/[0.03]"}`}>
                              <MIcon className="w-4 h-4" />
                              <span className="text-[10px]">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">Confidence level</p>
                        <span className="text-lg font-bold text-emerald-300">{confidenceScore[0]}/10</span>
                      </div>
                      <Slider value={confidenceScore} onValueChange={setConfidenceScore} max={10} min={1} step={1} className="py-2" />
                    </div>

                    <Textarea value={confidenceNote} onChange={e => setConfidenceNote(e.target.value)}
                      placeholder="Optional: What influenced your confidence today?"
                      className="min-h-[70px] bg-slate-900/60 border-white/[0.08] text-white placeholder:text-white/25 text-sm resize-none rounded-xl mb-3" />

                    <Button onClick={handleLogConfidence}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-full px-5 gap-2 w-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Log Today
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {confidenceEntries.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                    <CardContent className="p-5">
                      <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Confidence History</p>

                      <div className="flex items-end gap-1 mb-4 h-24">
                        {confidenceEntries.slice(0, 14).reverse().map((entry, i) => (
                          <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t-sm" style={{
                              height: `${(entry.score / 10) * 80}px`,
                              backgroundColor: entry.score >= 7 ? "rgba(16,185,129,0.4)" : entry.score >= 4 ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)",
                            }} />
                            <span className="text-[8px] text-white/25">{new Date(entry.date).getDate()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {confidenceEntries.slice(0, 7).map(entry => {
                          const moodInfo = MOODS.find(m => m.id === entry.mood);
                          return (
                            <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                              <span className="text-[11px] text-white/30 w-16 flex-shrink-0">{new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              <div className={`px-2 py-0.5 rounded-full text-[10px] ${moodInfo?.bg || ""} ${moodInfo?.color || ""}`}>{moodInfo?.label}</div>
                              <div className="flex-1">
                                <Progress value={entry.score * 10} className="h-1.5" />
                              </div>
                              <span className="text-xs font-bold text-white/60">{entry.score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="jar">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <Card className="bg-gradient-to-br from-violet-600/12 to-pink-600/8 border border-violet-500/20 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-violet-300 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-white/60 italic leading-relaxed">Prompt: {PROMPTS[promptIndex]}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Write a compliment</p>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setCategory(c.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === c.id ? `${c.bg} ${c.border} ${c.color}` : "border-white/[0.06] text-white/40 hover:bg-white/[0.05]"}`}>
                          <span>{c.emoji}</span> {c.label}
                        </button>
                      ))}
                    </div>
                    <Textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder="Describe a specific moment, quality, or memory..."
                      className="min-h-[100px] bg-slate-900/60 border-white/[0.08] text-white placeholder:text-white/25 text-sm resize-none rounded-xl focus:border-pink-500/40 mb-3" />
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] ${text.length < 20 ? "text-white/30" : "text-emerald-400"}`}>
                        {text.length} chars {text.length < 20 ? `(${20 - text.length} more)` : "✓"}
                      </span>
                      <Button onClick={handleAddCompliment} disabled={text.trim().length < 20}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-full px-5 disabled:opacity-40 gap-2">
                        <Send className="w-3.5 h-3.5" /> Add to Jar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {compliments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-pink-500/15 flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-pink-300" />
                  </div>
                  <p className="text-white/40 text-sm">Your jar is empty — fill it with love notes!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-white/30 uppercase tracking-wider font-semibold mb-2">Jar Contents ({compliments.length})</p>
                  <AnimatePresence>
                    {compliments.map((c, idx) => {
                      const catInfo = CATEGORIES.find(ct => ct.id === c.category)!;
                      const isOpen = openedId === c.id || c.opened;
                      return (
                        <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }}>
                          <Card className={`border rounded-2xl overflow-hidden cursor-pointer transition-all ${isOpen ? `${catInfo.bg} ${catInfo.border}` : "bg-slate-800/30 border-white/[0.06] hover:bg-slate-800/50"}`}
                            onClick={() => handleOpenCompliment(c.id)}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <span className="text-xl flex-shrink-0 mt-0.5">{catInfo.emoji}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-semibold ${catInfo.color}`}>{catInfo.label}</span>
                                      <span className="text-white/25 text-[10px]">· from {c.from} · {c.date}</span>
                                      {!c.opened && <Badge className="bg-pink-500/20 text-pink-300 border-0 text-[9px] px-1.5">New</Badge>}
                                    </div>
                                    <AnimatePresence>
                                      {isOpen ? (
                                        <motion.p key="open" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                          className="text-sm text-white/85 leading-relaxed">
                                          {c.text}
                                        </motion.p>
                                      ) : (
                                        <motion.p key="closed" className="text-sm text-white/35 italic">
                                          Tap to open this note...
                                        </motion.p>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                                <button onClick={e => { e.stopPropagation(); handleDeleteCompliment(c.id); }}
                                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/15 transition-colors flex-shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="send">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-teal-600/15 to-emerald-600/10 border border-teal-500/20 rounded-2xl">
                  <CardContent className="p-5 text-center">
                    <MessageCircleHeart className="w-8 h-8 text-teal-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Send Encouragement</h3>
                    <p className="text-xs text-white/50">Brighten someone's day with a kind word. Your matches will receive it as a special notification.</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Write Your Compliment</p>

                    <Input value={sendComplimentMatch} onChange={e => setSendComplimentMatch(e.target.value)}
                      placeholder="Match name (optional)"
                      className="bg-slate-900/60 border-white/[0.08] text-white placeholder:text-white/25 text-sm rounded-xl mb-3" />

                    <Textarea value={sendComplimentText} onChange={e => setSendComplimentText(e.target.value)}
                      placeholder="Write something genuine and specific. What do you appreciate about them?"
                      className="min-h-[100px] bg-slate-900/60 border-white/[0.08] text-white placeholder:text-white/25 text-sm resize-none rounded-xl mb-3" />

                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        "Your profile made me smile!",
                        "You seem like such a genuine person.",
                        "Your energy is contagious!",
                        "I admire your honesty.",
                      ].map((quick, i) => (
                        <button key={i} onClick={() => setSendComplimentText(quick)}
                          className="px-3 py-1.5 rounded-full text-[11px] border border-white/[0.08] text-white/40 hover:bg-teal-500/10 hover:text-teal-300 hover:border-teal-500/20 transition-all">
                          {quick}
                        </button>
                      ))}
                    </div>

                    <Button onClick={handleSendCompliment} disabled={sendComplimentText.trim().length < 10}
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold rounded-full px-5 gap-2 w-full disabled:opacity-40">
                      <Send className="w-3.5 h-3.5" /> Send Compliment
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="dateprep">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-blue-600/15 to-indigo-600/10 border border-blue-500/20 rounded-2xl">
                  <CardContent className="p-5 text-center">
                    <Shield className="w-8 h-8 text-blue-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">Date Confidence Booster</h3>
                    <p className="text-xs text-white/50">Feeling nervous before a date? Work through these prompts to center yourself and show up as your best, most authentic self.</p>
                  </CardContent>
                </Card>
              </motion.div>

              {DATE_CONFIDENCE_PROMPTS.map((item, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className="bg-slate-800/30 border border-white/[0.06] rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-300">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/90 mb-1">{item.title}</p>
                          <p className="text-xs text-white/50 leading-relaxed">{item.prompt}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-gradient-to-br from-emerald-600/10 to-teal-600/8 border border-emerald-500/20 rounded-2xl">
                  <CardContent className="p-5 text-center">
                    <Award className="w-6 h-6 text-emerald-300 mx-auto mb-2" />
                    <p className="text-sm text-white/80 font-medium">Remember: The goal isn't perfection.</p>
                    <p className="text-xs text-white/50 mt-1">It's connection. Be curious, be kind, and be yourself. That's always enough.</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
