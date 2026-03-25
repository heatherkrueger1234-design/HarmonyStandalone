// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════════╗
// ║  🔒 LOCKED — DO NOT MODIFY WITHOUT EXPLICIT APPROVAL                 ║
// ║  Status: VERIFIED WORKING ✅  (confirmed 2026-03-08)                 ║
// ║  Privacy dividers: "Your Couple Space" + "Your Private Side"         ║
// ║  Error boundaries: EchoBond, PartnerStatus, FeatureCategories        ║
// ╚══════════════════════════════════════════════════════════════════════╝
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ONBOARDING_MODE } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { convertToInternalUrl } from "@/lib/imageUtils";
import { motion, AnimatePresence } from "framer-motion";
import { WadeMemo } from '@/components/WadeMemo';
import { useCoupleSession } from "@/hooks/useCoupleSession";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { HarmonyAffiliateCard } from "@/components/HarmonyAffiliateCard";
import {
  Heart, Brain, Calendar, Shirt, Gamepad2, ArrowRight, Copy,
  Users, Link2, CheckCircle, Sparkles, Sprout,
  Flame, Star, Trophy, MessageCircle, Camera,
  ChevronRight, Scale, BookOpen, Pencil, Zap,
  Smile, Languages, Share2, Film, BrainCircuit,
  CalendarDays, Gift, ShieldAlert, Shield, HeartHandshake, Info, Baby, CheckCircle2,
  Settings, Bell, Home, ChevronDown, ScrollText, MessageSquare, Lock, Mic
} from "lucide-react";
import { RealtimeVoiceChat } from "@/components/RealtimeVoiceChat";
import AudioAnalyzer from "@/components/AudioAnalyzer";
import ErrorBoundary from "@/components/ErrorBoundary";

interface PartnerStatus {
  hasPartner: boolean;
  partnerName?: string;
  partnerAssessmentComplete?: boolean;
  inviteCode?: string;
  compatibility?: number;
}

interface GamificationData {
  xp?: number;
  level?: number;
  streak?: number;
  rank?: number;
}

function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return count;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const MOODS = [
  { emoji: "😍", label: "In love",    color: "text-rose-400",    bg: "bg-rose-500/25",    border: "border-rose-400/60" },
  { emoji: "😊", label: "Happy",      color: "text-amber-400",   bg: "bg-amber-500/25",   border: "border-amber-400/60" },
  { emoji: "😌", label: "Calm",       color: "text-violet-400",  bg: "bg-violet-500/25",  border: "border-violet-400/60" },
  { emoji: "😔", label: "Off today",  color: "text-blue-400",    bg: "bg-blue-500/25",    border: "border-blue-400/60" },
  { emoji: "😤", label: "Frustrated", color: "text-red-400",     bg: "bg-red-500/25",     border: "border-red-400/60" },
  { emoji: "🥰", label: "Grateful",   color: "text-fuchsia-400", bg: "bg-fuchsia-500/25", border: "border-fuchsia-400/60" },
];

const DAILY_NOTES = [
  "Relationships grow when both people choose each other daily, not just when it's easy.",
  "The secret to lasting love isn't finding the right person — it's being the right partner.",
  "A small act of appreciation today builds the foundation of trust for tomorrow.",
  "Disagreements are not threats to your relationship. How you repair them is what matters.",
  "Quality time doesn't mean expensive time. Presence is the greatest gift you can offer.",
  "Tell your partner one thing you love about them today. Say it out loud.",
  "Vulnerability is not weakness in a relationship — it's the doorway to real intimacy.",
  "When you feel disconnected, reach for curiosity before criticism.",
  "The way you speak about your partner when they're not around reveals the health of your love.",
  "A couple that laughs together builds resilience against life's hardest moments.",
  "Your partner doesn't need you to be perfect. They need you to be present.",
  "Gratitude, expressed regularly, is the single most powerful predictor of relationship satisfaction.",
  "Choose to see your partner's intentions before you react to their actions.",
  "Every conflict is an opportunity to understand each other more deeply.",
  "Love is not a feeling that happens to you — it's a practice you choose.",
];

const DAILY_CONNECTION_CHALLENGES = [
  { emoji: '👁️', prompt: 'Make eye contact for 60 seconds without laughing. Just be seen.', duration: '1 min' },
  { emoji: '🙏', prompt: 'Each share three specific things you appreciate about each other right now.', duration: '5 min' },
  { emoji: '🤲', prompt: 'Hold hands in silence for 2 minutes. No phones. No talking. Just presence.', duration: '2 min' },
  { emoji: '💌', prompt: 'Write your partner a genuine compliment and read it out loud.', duration: '3 min' },
  { emoji: '🎵', prompt: 'Play a song that reminds you of a happy memory together and share why.', duration: '5 min' },
  { emoji: '🧠', prompt: 'Ask: "What\'s one thing I could do this week that would make you feel more loved?" Listen fully.', duration: '10 min' },
  { emoji: '🌙', prompt: 'Share your highlight and low point from today — no problem-solving, just listening.', duration: '5 min' },
  { emoji: '😂', prompt: 'Share the funniest thing that happened to you this week. Laugh together.', duration: '5 min' },
  { emoji: '🌟', prompt: 'Ask your partner: "What dream of yours do you feel I don\'t know well enough?"', duration: '10 min' },
  { emoji: '🤗', prompt: 'Give a 20-second hug — research says this releases oxytocin and builds trust.', duration: '1 min' },
  { emoji: '📸', prompt: 'Find your favorite photo of you two together and tell the story behind it.', duration: '5 min' },
  { emoji: '🍳', prompt: 'Cook or prepare something simple together. Even tea counts.', duration: '15 min' },
  { emoji: '🎯', prompt: 'Pick one shared goal and plan one concrete action you\'ll take this week.', duration: '10 min' },
  { emoji: '💬', prompt: 'Each finish the sentence: "You make me feel safe when you..."', duration: '3 min' },
  { emoji: '🌅', prompt: 'Imagine your ideal day 10 years from now. Describe it to each other.', duration: '10 min' },
  { emoji: '🎁', prompt: 'Surprise your partner with something small and unexpected — a coffee, a sticky note, anything.', duration: '5 min' },
  { emoji: '🧘', prompt: 'Do three deep breaths together, synchronized. Ground yourselves as a unit.', duration: '2 min' },
  { emoji: '📝', prompt: 'Each write down one thing that\'s been on your mind and hasn\'t come up in conversation.', duration: '5 min' },
  { emoji: '🚶', prompt: 'Take a 10-minute walk together with no phones and no agenda. Just walk.', duration: '10 min' },
  { emoji: '🌹', prompt: 'Ask: "Is there anything between us right now that we need to address?"', duration: '15 min' },
  { emoji: '🎲', prompt: 'Play a 5-minute game together — cards, trivia, anything playful.', duration: '5 min' },
  { emoji: '💭', prompt: 'Share a worry you\'ve been carrying alone. Let your partner just hold it with you.', duration: '10 min' },
  { emoji: '🧩', prompt: 'Ask: "What\'s one habit of mine that secretly helps you feel more settled?"', duration: '5 min' },
  { emoji: '🌈', prompt: 'Each share one thing that went right this week — big or small.', duration: '5 min' },
  { emoji: '✨', prompt: 'Say "I\'m proud of you" about something specific you\'ve noticed lately.', duration: '3 min' },
  { emoji: '🏡', prompt: 'Talk about one thing you want to create or improve in your shared space this month.', duration: '10 min' },
  { emoji: '🐾', prompt: 'Ask: "What do you need from me today that you haven\'t asked for?"', duration: '5 min' },
  { emoji: '🌊', prompt: 'Each describe one fear you have about the future — then name one reason you feel safe together.', duration: '10 min' },
  { emoji: '🎤', prompt: 'Sing or hum together — even badly. It breaks tension and creates joy.', duration: '3 min' },
  { emoji: '🤝', prompt: 'Recommit to one thing you both want to do differently this month.', duration: '10 min' },
  { emoji: '💡', prompt: 'Share a random fact or idea that\'s been in your head. Invite them into your mind.', duration: '5 min' },
];

const couplesChallenges = [
  { id: 1, title: "Send your partner a loving message",            icon: MessageCircle, points: 10, color: "text-rose-400",    bg: "bg-rose-500/15",    border: "border-rose-400/40"    },
  { id: 2, title: "Share one thing you appreciate about them",     icon: Heart,         points: 15, color: "text-fuchsia-400", bg: "bg-fuchsia-500/15", border: "border-fuchsia-400/40" },
  { id: 3, title: "Complete a growth exercise together",           icon: Sprout,        points: 20, color: "text-violet-400",  bg: "bg-violet-500/15",  border: "border-violet-400/40"  },
  { id: 4, title: "Plan something to look forward to this week",   icon: Calendar,      points: 15, color: "text-amber-400",   bg: "bg-amber-500/15",   border: "border-amber-400/40"   },
  { id: 5, title: "Add a memory to your Compliment Jar",           icon: Gift,          points: 10, color: "text-cyan-400",    bg: "bg-cyan-500/15",    border: "border-cyan-400/40"    },
];

const QUICK_TOOLS = [
  { label: "AI Coach",    icon: Brain,       path: "/harmony-pro",                  color: "from-violet-500 to-purple-600",   shadow: "shadow-violet-500/40",  badge: null },
  { label: "Fight Judge", icon: Scale,       path: "/harmony-pro?mode=fight-judge", color: "from-rose-500 to-pink-600",       shadow: "shadow-rose-500/40",    badge: "Hot" },
  { label: "Dream Board",  icon: Sparkles,    path: "/vision-board?section=harmony",  color: "from-fuchsia-500 to-violet-600",  shadow: "shadow-fuchsia-500/40", badge: "New" },
  { label: "Date Planner",icon: Calendar,    path: "/date-planner",                 color: "from-amber-500 to-orange-500",    shadow: "shadow-amber-500/40",   badge: null },
  { label: "EchoBond",    icon: BrainCircuit,path: "/echobond",                     color: "from-fuchsia-500 to-violet-600",  shadow: "shadow-fuchsia-500/40", badge: "Unique" },
];

const MENTAL_LOAD_FACTS = [
  { emoji: '🧠', fact: '"Mental load of sex" is the invisible work of managing a couple\'s intimate life — initiating, planning, anticipating needs, tracking who wanted what, managing rejection.' },
  { emoji: '📊', fact: 'Studies show the mental load of sex falls disproportionately on women — but affects anyone in a relationship where one partner is the primary initiator.' },
  { emoji: '💬', fact: 'Having to always initiate makes desire feel like a chore. The desire to be desired — to have a partner notice and act without prompting — is one of the most common unspoken relationship needs.' },
  { emoji: '🔄', fact: 'The "Initiator Burden" creates a cycle: one person always initiates, begins to feel unwanted when rejected, and eventually stops. The other partner then wonders why intimacy faded.' },
  { emoji: '✅', fact: 'Redistributing the mental load of sex requires explicit conversation about initiation, desire cues, and each person\'s comfort with rejection — not just hoping the other person figures it out.' },
];

const MENTAL_LOAD_TOOLS = [
  { id: 'schedule', emoji: '📅', label: 'Intimacy Check-Ins',          desc: 'Schedule a weekly 5-minute conversation about physical closeness — not performance, just connection. Remove the ambiguity.' },
  { id: 'desire',   emoji: '💭', label: 'Desire Communication Cards',  desc: 'Each partner writes what they need this week — emotional, physical, relational — and exchanges. No guessing.' },
  { id: 'rotate',   emoji: '🔄', label: 'Initiation Rotation',         desc: 'Agree to alternate who initiates. This distributes the emotional risk of rejection equally and gives each person the experience of being desired.' },
  { id: 'signal',   emoji: '🕯️', label: 'Shared Signal System',        desc: 'Create a private signal that means "I\'m open to closeness tonight." Removes the pressure of verbal initiation.' },
  { id: 'debrief',  emoji: '🌙', label: 'After-Intimacy Debrief',      desc: 'A 2-minute "what worked, what didn\'t" conversation after intimacy builds a feedback loop that makes future experiences better.' },
];

const featureCategories = [
  {
    label: "Coaching & Conflict",
    icon: Brain,
    accent: "from-violet-500 to-purple-600",
    cards: [
      { title: "AI Relationship Coach",   description: "Expert coaching, conflict resolution, and personalized advice", icon: Brain,       path: "/harmony-pro",                gradient: "from-violet-500 to-purple-600",   glow: "hover:shadow-violet-500/30", iconBg: "bg-violet-500/20", iconColor: "text-violet-300", badge: null },
      { title: "Fight Judge",              description: "AI mediates conflicts fairly, helping both feel heard",          icon: Scale,       path: "/harmony-pro?mode=fight-judge", gradient: "from-rose-500 to-pink-600",       glow: "hover:shadow-rose-500/30",   iconBg: "bg-rose-500/20",   iconColor: "text-rose-300",   badge: "Hot" },
      { title: "Love Language Coach",      description: "Decode how you and your partner give and receive love",          icon: Languages,   path: "/harmony-pro?mode=love-language",gradient:"from-fuchsia-500 to-pink-600",    glow: "hover:shadow-fuchsia-500/30",iconBg: "bg-fuchsia-500/20",iconColor: "text-fuchsia-300", badge: "New" },
      { title: "Growth & Healing",         description: "Homework, joint activities, rekindling exercises and AI guides", icon: Sprout,      path: "/harmony-growth",               gradient: "from-emerald-500 to-teal-600",    glow: "hover:shadow-emerald-500/30",iconBg: "bg-emerald-500/20",iconColor: "text-emerald-300", badge: null },
      { title: "Couples Compatibility",    description: "Compare AMBI scores and get an AI reality check on your long-term fit", icon: Heart, path: "/couples-ambi-compare",          gradient: "from-rose-500 to-fuchsia-600",    glow: "hover:shadow-rose-500/30",   iconBg: "bg-rose-500/20",   iconColor: "text-rose-300",   badge: "New" },
      { title: "Life Portrait",            description: "AI builds a deep narrative from your personality, values & memories",   icon: ScrollText, path: "/couples-life-portrait",     gradient: "from-indigo-500 to-violet-600",   glow: "hover:shadow-indigo-500/30", iconBg: "bg-indigo-500/20", iconColor: "text-indigo-300", badge: "AI"  },
      { title: "AMBI 181 Test",            description: "Full personality assessment for couple compatibility scores",    icon: Brain,       path: "/ambi-hub",                     gradient: "from-blue-500 to-indigo-600",     glow: "hover:shadow-blue-500/30",   iconBg: "bg-blue-500/20",   iconColor: "text-blue-300",   badge: "Core" },
    ],
  },
  {
    label: "Connection & Fun",
    icon: Sparkles,
    accent: "from-fuchsia-500 to-rose-500",
    cards: [
      { title: "EchoBond Chamber",   description: "AI replays your best moments — reinterpreted for deeper empathy",        icon: BrainCircuit, path: "/echobond",          gradient: "from-fuchsia-600 to-violet-700",  glow: "hover:shadow-fuchsia-500/30", iconBg: "bg-fuchsia-500/20", iconColor: "text-fuchsia-300", badge: "Unique" },
      { title: "Relationship Games", description: "Fun couple games designed to deepen your connection",                    icon: Gamepad2,     path: "/games",              gradient: "from-amber-500 to-orange-600",    glow: "hover:shadow-amber-500/30",   iconBg: "bg-amber-500/20",   iconColor: "text-amber-300",   badge: "Fun"    },
      { title: "Date Planner",       description: "AI-powered date ideas with recommendations and bookings",                 icon: Calendar,     path: "/date-planner",       gradient: "from-rose-500 to-pink-600",       glow: "hover:shadow-rose-500/30",    iconBg: "bg-rose-500/20",    iconColor: "text-rose-300",    badge: null     },
      { title: "What Should I Wear", description: "Community outfit votes and style advice for dates and events",           icon: Shirt,        path: "/what-should-i-wear", gradient: "from-cyan-500 to-blue-600",       glow: "hover:shadow-cyan-500/30",    iconBg: "bg-cyan-500/20",    iconColor: "text-cyan-300",    badge: null     },
      { title: "Couple Dream Board",   description: "Your shared vision board — manifest your life together with AI photos, couple goals & dream notes", icon: Sparkles,     path: "/vision-board?section=harmony",       gradient: "from-violet-600 to-fuchsia-600",  glow: "hover:shadow-violet-500/30",  iconBg: "bg-violet-500/20",  iconColor: "text-violet-300",  badge: "New"    },
      { title: "Couples Photos",     description: "Build a private shared gallery of your favorite memories",               icon: Camera,       path: "/couples-photos",     gradient: "from-violet-500 to-indigo-600",   glow: "hover:shadow-violet-500/30",  iconBg: "bg-violet-500/20",  iconColor: "text-violet-300",  badge: null     },
      { title: "Compliment Jar",     description: "Leave specific, heartfelt notes for your partner to open",               icon: Gift,         path: "/compliment-jar",     gradient: "from-rose-500 to-fuchsia-600",    glow: "hover:shadow-rose-500/30",    iconBg: "bg-rose-500/20",    iconColor: "text-rose-300",    badge: "Loving" },
    ],
  },
  {
    label: "Journaling & Reflection",
    icon: BookOpen,
    accent: "from-indigo-500 to-violet-600",
    cards: [
      { title: "Relationship Journal",   description: "Capture thoughts, gratitude and milestones together",          icon: BookOpen,  path: "/harmony-growth",        gradient: "from-indigo-500 to-violet-600",glow: "hover:shadow-indigo-500/30", iconBg: "bg-indigo-500/20", iconColor: "text-indigo-300", badge: null },
      { title: "Share Log",              description: "Shared diary with mood check-ins and weekly reminders",        icon: BookOpen,  path: "/share-log",             gradient: "from-violet-500 to-fuchsia-600",glow: "hover:shadow-violet-500/30",iconBg: "bg-violet-500/20", iconColor: "text-violet-300",badge: "Daily" },
      { title: "Memory Reel",            description: "AI-curated highlights of your relationship journey",           icon: Film,      path: "/harmony-growth",        gradient: "from-rose-500 to-pink-600",    glow: "hover:shadow-rose-500/30",   iconBg: "bg-rose-500/20",   iconColor: "text-rose-300",  badge: null    },
      { title: "Relationship Education", description: "Deep dives on mental load, attachment, love languages & more", icon: Info,      path: "/relationship-education",gradient: "from-blue-500 to-indigo-600",  glow: "hover:shadow-blue-500/30",   iconBg: "bg-blue-500/20",   iconColor: "text-blue-300",  badge: "Insightful" },
    ],
  },
  {
    label: "Planning & Safety",
    icon: ShieldAlert,
    accent: "from-amber-500 to-orange-500",
    cards: [
      { title: "Future Us Simulator",  description: "AI predicts your life together in 5 years — across stress, money, travel & more", icon: Sparkles,      path: "/future-us",         gradient: "from-indigo-500 to-violet-600",   glow: "hover:shadow-indigo-500/30", iconBg: "bg-indigo-500/20",   iconColor: "text-indigo-300",  badge: "Viral" },
      { title: "BabelBridge",          description: "Rewrite what you're about to send in a tone your partner can actually hear",       icon: MessageSquare, path: "/babel-bridge",      gradient: "from-fuchsia-500 to-purple-600",  glow: "hover:shadow-fuchsia-500/30",iconBg: "bg-fuchsia-500/20",  iconColor: "text-fuchsia-300", badge: "New"   },
      { title: "Chore Divider",        description: "Divide every household task — inside & out — so nothing is missed",               icon: Home,          path: "/chores-divider",    gradient: "from-amber-500 to-orange-600",    glow: "hover:shadow-amber-500/30",  iconBg: "bg-amber-500/20",    iconColor: "text-amber-300",   badge: null   },
      { title: "Family & Future",      description: "Align on kids, pets, and your shared life vision",                                icon: Baby,          path: "/harmony-growth",    gradient: "from-emerald-500 to-teal-600",    glow: "hover:shadow-emerald-500/30",iconBg: "bg-emerald-500/20",  iconColor: "text-emerald-300", badge: null   },
      { title: "Emergency Plans",      description: "Shared emergency contacts, wishes, and vital information",                        icon: ShieldAlert,   path: "/emergency-contacts",gradient: "from-red-500 to-rose-600",        glow: "hover:shadow-red-500/30",    iconBg: "bg-red-500/20",      iconColor: "text-red-300",     badge: "Essential" },
      { title: "Community Forum",      description: "Share tips, stories and support with other couples",                              icon: Users,         path: "/community-board",   gradient: "from-cyan-500 to-blue-600",       glow: "hover:shadow-cyan-500/30",   iconBg: "bg-cyan-500/20",     iconColor: "text-cyan-300",    badge: "Viral" },
      { title: "Refer Couples",         description: "Refer 3 couples to Harmony and earn 1 free month — stackable every 3",           icon: Gift,          path: "/refer-couples",     gradient: "from-pink-500 to-purple-600",     glow: "hover:shadow-pink-500/30",   iconBg: "bg-pink-500/20",     iconColor: "text-pink-300",    badge: "Free Month" },
      { title: "Coercive Control Guide", description: "Abuse in relationships is often invisible at first. Learn the 10 patterns — jealousy, isolation, financial control, DARVO, and more.", icon: ShieldAlert, path: "/safety", gradient: "from-rose-600 to-red-700", glow: "hover:shadow-rose-500/30", iconBg: "bg-rose-500/20", iconColor: "text-rose-300", badge: "Awareness" },
      { title: "Crisis Resources",     description: "Need help? Crisis resources available 24/7", icon: ShieldAlert, path: "/safety", gradient: "from-red-500 to-rose-600", glow: "hover:shadow-red-500/30", iconBg: "bg-red-500/20", iconColor: "text-rose-300", badge: "Help" },
      { title: "Safety Corner",        description: "Built by a DV survivor. Our commitment to your safety.", icon: Shield,        path: "/safety",            gradient: "from-teal-500 to-emerald-600",    glow: "hover:shadow-teal-500/30",   iconBg: "bg-teal-500/20",     iconColor: "text-teal-300",    badge: "Essential" },
      { title: "Need help? Crisis resources available", description: "Confidential 24/7 support resources", icon: HeartHandshake, path: "/safety", gradient: "from-teal-600 to-emerald-700", glow: "hover:shadow-teal-500/30", iconBg: "bg-teal-500/20", iconColor: "text-teal-300", badge: "Help" },
    ],
  },
  {
    label: "Optional Assessments",
    icon: BookOpen,
    accent: "from-violet-500 to-indigo-600",
    cards: [
      { title: "Harmony Quizzes", description: "22 relationship, personality & conflict quizzes — Love Languages, Gottman Four Horsemen, Attachment Style, Trust Scale, Communication Quality, Future Vision, Forgiveness & more. All results update your Life Portrait.", icon: HeartHandshake, path: "/harmony-quizzes", gradient: "from-rose-500 to-pink-600", glow: "hover:shadow-rose-500/30", iconBg: "bg-rose-500/20", iconColor: "text-rose-300", badge: "22 Quizzes" },
      { title: "All Optional Tests", description: "Enneagram, Love Languages, Attachment Style, MBTI, Dark Triad, IQ, EQ, Resilience, Self-Esteem, Sternberg Love, Gottman Horsemen, Communication Patterns & more — 16 validated assessments in one place", icon: Brain, path: "/optional-tests", gradient: "from-violet-500 to-indigo-600", glow: "hover:shadow-violet-500/30", iconBg: "bg-violet-500/20", iconColor: "text-violet-300", badge: "16 Tests" },
      { title: "Relationship Grade Report", description: "Get your A–F relationship readiness grade — computed from your assessments, with strengths, growth areas, and personalised insights", icon: Trophy, path: "/relationship-grade", gradient: "from-amber-500 to-orange-600", glow: "hover:shadow-amber-500/30", iconBg: "bg-amber-500/20", iconColor: "text-amber-300", badge: "New" },
    ],
  },
  {
    label: "Romance & Intimacy",
    icon: Flame,
    accent: "from-rose-500 to-fuchsia-500",
    cards: [
      { title: "Spark & Intimacy Hub",  description: "Connection dice, 29 ways to deepen your bond, weekend getaways, themed nights, holiday ideas, and curated shop picks — all in one place.", icon: Flame,    path: "/harmony-intimacy",                            gradient: "from-rose-500 to-fuchsia-600",    glow: "hover:shadow-rose-500/30",    iconBg: "bg-rose-500/20",    iconColor: "text-rose-300",    badge: "New" },
      { title: "Spa Day Deals",         description: "Up to 60% off couples massages, facials & float experiences via Groupon — treat your body as sacred space together.",       icon: Star,     path: "https://www.groupon.com/local/spas-massages",           gradient: "from-violet-500 to-purple-600",   glow: "hover:shadow-violet-500/30",  iconBg: "bg-violet-500/20",  iconColor: "text-violet-300",  badge: "Groupon", external: true },
      { title: "Hotel Weekend Escape",  description: "Surprise your partner with a getaway. Up to 50% off hotels via Groupon. A change of scenery changes everything.",           icon: Star,     path: "https://www.groupon.com/getaways/hotels",               gradient: "from-blue-500 to-indigo-600",     glow: "hover:shadow-blue-500/30",    iconBg: "bg-blue-500/20",    iconColor: "text-blue-300",    badge: "Groupon", external: true },
      { title: "Fine Dining for Two",   description: "Up to 45% off restaurant deals in your city. The table is set. All you have to do is show up for each other.",             icon: Star,     path: "https://www.groupon.com/local/restaurants",             gradient: "from-rose-500 to-pink-600",       glow: "hover:shadow-rose-500/30",    iconBg: "bg-rose-500/20",    iconColor: "text-rose-300",    badge: "Groupon", external: true },
      { title: "Couples Adventures",    description: "Cooking classes, art sessions, escape rooms — try something new together and build a memory that belongs to just you two.", icon: Star,     path: "https://www.groupon.com/local/activities",              gradient: "from-emerald-500 to-teal-600",    glow: "hover:shadow-emerald-500/30", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-300", badge: "Groupon", external: true },
      { title: "Vacation Packages",     description: "The trip you've been talking about. Up to 70% off travel packages. Go. Life is short. Go together.",                       icon: Star,     path: "https://www.groupon.com/getaways",                      gradient: "from-amber-500 to-orange-600",    glow: "hover:shadow-amber-500/30",   iconBg: "bg-amber-500/20",   iconColor: "text-amber-300",   badge: "Groupon", external: true },
    ],
  },
];

const NAV_TABS = [
  { label: "Hub",     icon: Home,     path: "/harmony-hub"    },
  { label: "Coach",   icon: Brain,    path: "/harmony-pro"    },
  { label: "Growth",  icon: Sprout,   path: "/harmony-growth" },
  { label: "Games",   icon: Gamepad2, path: "/games"          },
  { label: "Partner", icon: Users,    path: "/harmony-hub"    },
];

const RANK_BADGES = ["🏆", "🥈", "🥉", "⭐", "💜"];

export default function HarmonyHub() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const coachingPaid = params.get("coaching_paid");
    const sessionId = params.get("session_id");
    const giftPaid = params.get("gift_paid");
    const giftSessionId = params.get("gift_session_id");

    if (coachingPaid === "true" && sessionId) {
      window.history.replaceState({}, "", "/harmony-hub");
      apiRequest("POST", "/api/harmony/verify-coaching", { sessionId })
        .then(r => r.json())
        .then((data: { success?: boolean; message?: string; hoursRemaining?: number }) => {
          if (data.success) {
            toast({ title: "Coaching time added!", description: data.message || "3 hours have been added to your coaching balance." });
            queryClient.invalidateQueries({ queryKey: ["/api/coaching/hours-status"] });
          }
        })
        .catch(() => toast({ title: "Purchase received", description: "Your coaching hours will appear shortly." }));
    }

    if (giftPaid === "true" && giftSessionId) {
      window.history.replaceState({}, "", "/harmony-hub");
      apiRequest("POST", "/api/harmony/verify-gift", { sessionId: giftSessionId })
        .then(r => r.json())
        .then((data: any) => {
          if (data.success) toast({ title: `${data.gift?.emoji || "💝"} Gift Sent!`, description: `Your ${data.gift?.label || "gift"} has been delivered to your partner.` });
        })
        .catch(() => toast({ title: "Gift sent!", description: "Your partner will see it shortly." }));
    }
  }, [toast]);

  const [harmonyVoiceOpen, setHarmonyVoiceOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedGiftType, setSelectedGiftType] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [showGiftPanel, setShowGiftPanel] = useState(false);

  const { receivedGift, clearReceivedGift } = useCoupleSession();

  useEffect(() => {
    if (receivedGift) {
      toast({ title: `${receivedGift.emoji} ${receivedGift.senderName} sent you a ${receivedGift.label}!`, description: receivedGift.message ? `"${receivedGift.message}"` : "How sweet!" });
      clearReceivedGift();
    }
  }, [receivedGift, clearReceivedGift, toast]);

  const [noteIndex] = useState(() => new Date().getDate() % DAILY_NOTES.length);
  const [challengeIdx] = useState(() => new Date().getDate() % DAILY_CONNECTION_CHALLENGES.length);
  const todayChallenge = DAILY_CONNECTION_CHALLENGES[challengeIdx];
  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => localStorage.getItem("anniversaryDate") || "");
  const [showAnnivInput, setShowAnnivInput] = useState(false);
  const [anniversaryInput, setAnniversaryInput] = useState("");
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`challenges_${new Date().toDateString()}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<number>();
    } catch { return new Set<number>(); }
  });

  const toggleChallenge = (id: number) => {
    setCompletedChallenges(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      localStorage.setItem(`challenges_${new Date().toDateString()}`, JSON.stringify([...next]));
      if (!prev.has(id)) toast({ title: "Challenge complete! 🎉", description: `+${couplesChallenges.find(c=>c.id===id)?.points||10} XP earned` });
      return next;
    });
  };

  const totalPoints = couplesChallenges.reduce((sum, c) => completedChallenges.has(c.id) ? sum + c.points : sum, 0);
  const maxPoints = couplesChallenges.reduce((sum, c) => sum + c.points, 0);

  const userData = user as any;
  const firstName = userData?.firstName || userData?.fullName?.split(" ")[0] || "Friend";

  const { data: partnerStatus, isLoading: partnerLoading } = useQuery<PartnerStatus>({ queryKey: ["/api/partner-invite/status"] });
  const { data: gamification } = useQuery<GamificationData>({ queryKey: ["/api/gamification/stats"] });
  const { data: leaderboardData } = useQuery<{ leaderboard: Array<{ id: string; fullName: string; streak: number; xp?: number }> }>({
    queryKey: ["/api/gamification/leaderboard", "streak"],
    queryFn: async () => {
      const res = await fetch("/api/gamification/leaderboard?type=streak", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const compatibility = partnerStatus?.compatibility ?? 0;
  const animatedCompat = useCountUp(compatibility);
  const streakVal = (gamification as any)?.streak ?? userData?.streak ?? 0;
  const animatedStreak = useCountUp(streakVal);
  const sessionCount = (gamification as any)?.sessionsCompleted ?? (gamification as any)?.totalSessions ?? 0;
  const animatedSessions = useCountUp(sessionCount);

  const daysUntilAnniversary = useMemo(() => {
    if (!anniversaryDate) return null;
    const today = new Date();
    const ann = new Date(anniversaryDate);
    const next = new Date(today.getFullYear(), ann.getMonth(), ann.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [anniversaryDate]);

  const habitData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      connection: Math.floor(60 + Math.random() * 35),
      predicted: Math.floor(65 + Math.random() * 30),
    }));
  }, []);

  const GIFTS = [
    { type: "rose",       emoji: "🌹", label: "Virtual Rose",   price: "$2.00", desc: "A rose delivered to your partner right now." },
    { type: "love_note",  emoji: "💌", label: "Love Note Card", price: "$3.00", desc: "A decorated digital card with your message."   },
    { type: "heart_burst",emoji: "💗", label: "Heart Burst",    price: "$5.00", desc: "An animated heart surprise for your partner."   },
  ];

  const sendGiftMutation = useMutation({
    mutationFn: async ({ giftType, message }: { giftType: string; message: string }) => {
      const res = await apiRequest("POST", "/api/harmony/checkout-gift", { giftType, message });
      return res.json();
    },
    onSuccess: (data: any) => { if (data.checkoutUrl) window.location.href = data.checkoutUrl; },
    onError: (err: any) => toast({ title: "Couldn't start gift checkout", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", "/api/partner-invite/create"); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/partner-invite/status"] }); toast({ title: "Invite Code Created!", description: "Share this code with your partner to link accounts." }); },
    onError: () => toast({ title: "Error", description: "Failed to create invite code.", variant: "destructive" }),
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteCode: string) => { const r = await apiRequest("POST", "/api/partner-invite/accept", { inviteCode }); return r.json(); },
    onSuccess: (data: any) => { toast({ title: "Partner Linked!", description: `You're now connected with ${data.partnerName || "your partner"}!` }); queryClient.invalidateQueries({ queryKey: ["/api/partner-invite/status"] }); },
    onError: () => toast({ title: "Invalid Code", description: "That invite code doesn't seem right. Ask your partner to send it again.", variant: "destructive" }),
  });

  const [partnerEmailInvite, setPartnerEmailInvite] = useState("");
  const [completedMentalLoadTools, setCompletedMentalLoadTools] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("harmony_ml_tools") || "[]")); } catch { return new Set(); }
  });
  const toggleMentalLoadTool = (id: string) => {
    setCompletedMentalLoadTools(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("harmony_ml_tools", JSON.stringify([...next]));
      return next;
    });
  };
  const emailInviteMutation = useMutation({
    mutationFn: async (email: string) => { const r = await apiRequest("POST", "/api/partner-invite/by-email", { email }); return r.json(); },
    onSuccess: (data: any) => {
      setPartnerEmailInvite("");
      if (data.linked) { toast({ title: "Partner Connected!", description: data.message }); queryClient.invalidateQueries({ queryKey: ["/api/partner-invite/status"] }); }
      else toast({ title: "Invitation Sent!", description: data.message || "Your partner will receive an email to connect." });
    },
    onError: (err: any) => toast({ title: "Could not send invite", description: err?.message || "Please try again.", variant: "destructive" }),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const partnerCodeFromUrl = params.get("partner_code") || sessionStorage.getItem("pending_partner_code");
    if (partnerCodeFromUrl) {
      sessionStorage.removeItem("pending_partner_code");
      window.history.replaceState({}, "", "/harmony-hub");
      acceptInviteMutation.mutate(partnerCodeFromUrl);
    }
  }, []);

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Invite code copied to clipboard." });
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleMoodSelect = (emoji: string) => {
    setSelectedMood(emoji);
    toast({ title: "Mood logged!", description: "Your partner will see how you're feeling today." });
  };

  const handleSaveAnniversary = () => {
    if (!anniversaryInput) return;
    localStorage.setItem("anniversaryDate", anniversaryInput);
    setAnniversaryDate(anniversaryInput);
    setShowAnnivInput(false);
    toast({ title: "Anniversary saved!", description: "We'll count down to your special day." });
  };

  const handleShareProgress = () => {
    const text = `We've been on a ${streakVal}-day streak on SyncWithInsight! 💜 Join us at syncwithinsight.com`;
    if (navigator.share) { navigator.share({ title: "Our Harmony Streak", text }); }
    else { navigator.clipboard.writeText(text); toast({ title: "Copied!", description: "Share text copied to clipboard." }); }
  };

  const hasCompletedAssessment = userData?.ambi80Completed || userData?.ambi181Completed ||
    userData?.personalityCompleted || userData?.screeningCompleted;

  if (!hasCompletedAssessment && !ONBOARDING_MODE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/50 to-teal-950/30 flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full relative">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/40">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Personality Assessment Required</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto">
              Before entering Harmony Hub, we need your AMBI personality profile. This helps us personalize your coaching, measure compatibility, and deliver better relationship insights.
            </p>
          </div>
          <div className="bg-white/[0.06] border border-white/[0.12] rounded-2xl p-5 mb-6 space-y-3 backdrop-blur-xl">
            {[
              { icon: "🎯", text: "Takes about 15–20 minutes" },
              { icon: "🔒", text: "Results are private and encrypted" },
              { icon: "💜", text: "Used only to improve your coaching" },
              { icon: "✅", text: "Required once — never repeated" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-white/70">
                <span className="text-lg">{icon}</span> {text}
              </div>
            ))}
          </div>
          <Button onClick={() => setLocation("/ambi-hub")}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold rounded-2xl py-3.5 gap-2 shadow-2xl shadow-violet-500/40 text-base">
            <Brain className="w-5 h-5" /> Take the AMBI Assessment
          </Button>
          <p className="text-center text-xs text-white/30 mt-3">You'll be brought right back here after completing it</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080510] pb-12">
      <WadeMemo hub="harmony" />

      {/* ── Ambient Background Orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rose-600/18 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[400px] h-[400px] bg-violet-600/18 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-fuchsia-600/12 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl" />
      </div>

      {/* ── Sticky Top Navigation ── */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-300 to-teal-300 bg-clip-text text-transparent hidden sm:block">Harmony</span>
            </div>

            <div className="flex items-center gap-0.5">
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = location === tab.path;
                return (
                  <button key={tab.label} onClick={() => setLocation(tab.path)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${isActive ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"}`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-blue-300" : ""}`} />
                    <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? "text-blue-300" : ""}`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setHarmonyVoiceOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 hover:bg-teal-500/20 transition-all text-[11px] font-semibold"
              >
                <Mic className="w-3.5 h-3.5" />
                Voice
              </button>
              <button onClick={() => setLocation("/account-settings")}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={() => setLocation("/eros-hub")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/[0.10] text-white/50 hover:text-white/80 hover:border-white/[0.18] transition-all text-[11px] font-semibold">
                Matching <ChevronRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">

        {/* ── Onboarding Banner ── */}
        {ONBOARDING_MODE && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500/20 via-teal-500/15 to-cyan-500/20 border border-blue-400/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold text-blue-200">Onboarding Access — Full coaching unlocked, free</span>
            </div>
            <Badge className="bg-teal-500/25 text-teal-300 border-teal-400/40 text-[10px]">Free</Badge>
          </motion.div>
        )}

        {/* ── Hero: Avatar + Greeting ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Avatar row */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* User avatar */}
            <div className="relative cursor-pointer group" onClick={() => setLocation("/profile/edit")}>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 via-fuchsia-400 to-violet-500 blur-xl opacity-70"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 via-fuchsia-400 to-violet-500 p-[3px] shadow-2xl shadow-rose-500/40">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0914]">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={convertToInternalUrl(userData?.profileImageUrl || "")} alt={firstName} className="object-cover" />
                    <AvatarFallback className="bg-slate-900 text-rose-400 text-3xl font-bold w-full h-full flex items-center justify-center">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Pencil className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Heart connector */}
            <motion.div
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="flex flex-col items-center gap-1"
            >
              <Heart className="w-7 h-7 text-rose-400 fill-rose-500/60" />
              {partnerStatus?.hasPartner && partnerStatus.compatibility !== undefined && (
                <span className="text-[10px] font-black text-rose-300">{partnerStatus.compatibility}%</span>
              )}
            </motion.div>

            {/* Partner avatar */}
            {partnerStatus?.hasPartner ? (
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 blur-xl opacity-70"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-rose-400 p-[3px] shadow-2xl shadow-violet-500/40">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0c0914] flex items-center justify-center">
                    <span className="text-3xl font-black text-violet-300">
                      {(partnerStatus.partnerName || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                onClick={() => document.getElementById("partner-section")?.scrollIntoView({ behavior: "smooth" })}
                className="relative cursor-pointer w-24 h-24 rounded-full border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-rose-400/40 transition-colors"
              >
                <Users className="w-7 h-7 text-white/20" />
                <span className="text-[9px] text-white/25 font-semibold text-center leading-tight px-2">Link Partner</span>
              </motion.div>
            )}
          </div>

          <h1 className="text-4xl font-black bg-gradient-to-r from-rose-200 via-white to-violet-200 bg-clip-text text-transparent mb-2 tracking-tight">
            {getTimeGreeting()}, {firstName}!
          </h1>
          <p className="text-base text-white/50 mb-4">
            {partnerStatus?.hasPartner
              ? `${firstName} & ${partnerStatus.partnerName} — your Harmony space`
              : "Your relationship coaching hub"}
          </p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <span className="text-white/30 text-xs">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20 inline-block" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-fuchsia-500/20 border border-rose-400/30">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-500/60" />
              <span className="text-rose-300 font-semibold text-xs">Harmony Mode</span>
            </div>
            {streakVal > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/25">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-orange-300 font-bold text-xs">{streakVal}d streak</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[10px] font-bold text-rose-300/50 uppercase tracking-widest px-2">Harmony Vitals</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }} onClick={() => setLocation("/relationship-coach")}
              className="relative overflow-hidden rounded-2xl p-4 text-center cursor-pointer group"
              style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.35) 0%, rgba(217,70,239,0.25) 100%)", border: "1px solid rgba(244,63,94,0.40)" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400/15 to-fuchsia-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <div className="text-3xl font-black text-white mb-1">
                {partnerStatus?.hasPartner ? `${animatedCompat}%` : "—"}
              </div>
              <div className="text-[10px] text-rose-300/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Heart className="w-2.5 h-2.5 fill-rose-400" /> Match
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }} onClick={() => setLocation("/harmony-growth")}
              className="relative overflow-hidden rounded-2xl p-4 text-center cursor-pointer group"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35) 0%, rgba(99,102,241,0.25) 100%)", border: "1px solid rgba(139,92,246,0.40)" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/15 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
              <div className="text-3xl font-black text-white mb-1">{animatedSessions}</div>
              <div className="text-[10px] text-violet-300/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Sessions
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-2xl p-4 text-center cursor-pointer group"
              style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.35) 0%, rgba(234,179,8,0.25) 100%)", border: "1px solid rgba(249,115,22,0.40)" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/15 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "1s" }} />
              <div className="text-3xl font-black text-white mb-1 flex items-center justify-center gap-1">
                {animatedStreak}<Flame className="w-5 h-5 text-orange-300" />
              </div>
              <div className="text-[10px] text-orange-300/90 font-bold uppercase tracking-wider">Streak</div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Relationship Pulse ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-teal-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-fuchsia-500/20 rounded-xl border border-fuchsia-400/20">
                    <Smile className="w-4 h-4 text-fuchsia-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Nervous System Check-In</h3>
                    <p className="text-[11px] text-white/40">Polyvagal state · shared with partner</p>
                  </div>
                </div>
                {selectedMood && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-400/25">
                    <CheckCircle className="w-3 h-3" /> Logged
                  </motion.div>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {MOODS.map((mood) => (
                  <motion.button key={mood.emoji} whileHover={{ scale: 1.18, y: -2 }} whileTap={{ scale: 0.9 }} onClick={() => handleMoodSelect(mood.emoji)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${selectedMood === mood.emoji ? `${mood.bg} ${mood.border}` : 'border-white/[0.07] hover:bg-white/[0.07] hover:border-white/[0.15]'}`}>
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className={`text-[9px] font-semibold ${selectedMood === mood.emoji ? mood.color : 'text-white/35'}`}>{mood.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Daily Love Note ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.18) 0%, rgba(217,70,239,0.12) 50%, rgba(99,102,241,0.09) 100%)", border: "1px solid rgba(244,63,94,0.28)" }}>
            <div className="absolute top-3 right-4 text-[80px] font-black text-rose-500/8 leading-none select-none pointer-events-none">"</div>
            <div className="absolute -bottom-2 left-4 text-[80px] font-black text-violet-500/8 leading-none select-none pointer-events-none">"</div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  className="p-2 bg-gradient-to-br from-rose-500/30 to-fuchsia-500/20 rounded-xl border border-rose-400/25"
                  animate={{ rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-rose-300" />
                </motion.div>
                <div>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">From Heather's Desk</span>
                  <p className="text-[10px] text-white/30 leading-none mt-0.5">Founder · DV survivor · a mother</p>
                </div>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-400/30 text-[10px] ml-auto">Daily</Badge>
              </div>
              <p className="text-base text-white/90 leading-relaxed font-medium italic pl-1">
                {DAILY_NOTES[noteIndex]}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Daily Connection Challenge ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(217,70,239,0.08) 100%)", border: "1px solid rgba(99,102,241,0.30)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 pointer-events-none" />
            <div className="relative flex items-start gap-4">
              <div className="text-4xl flex-shrink-0 leading-none filter drop-shadow-lg">{todayChallenge.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Today's Co-Regulation Practice</span>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30 text-[10px]">{todayChallenge.duration}</Badge>
                </div>
                <p className="text-[10px] text-indigo-400/60 mb-3">Polyvagal science · oxytocin-building · nervous system repair</p>
                <p className="text-sm text-white/85 leading-relaxed mb-4">{todayChallenge.prompt}</p>
                <button
                  onClick={() => toast({ title: "Practice started!", description: "Co-regulation builds felt safety in both nervous systems. Keep going." })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold hover:bg-indigo-500/30 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Begin Practice
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Anniversary Countdown ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-rose-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-400/20">
                    <Gift className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Memory Milestones</h3>
                    <p className="text-[11px] text-white/40">Anniversary countdown</p>
                  </div>
                </div>
                <button onClick={() => setShowAnnivInput(!showAnnivInput)}
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 px-2.5 py-1 rounded-lg transition-all">
                  {anniversaryDate ? "Edit" : "Set Date"}
                </button>
              </div>

              {showAnnivInput && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-3 flex gap-2">
                  <Input type="date" value={anniversaryInput} onChange={(e) => setAnniversaryInput(e.target.value)}
                    className="flex-1 bg-slate-900/60 border-amber-400/30 text-white text-sm h-9 rounded-xl" />
                  <Button onClick={handleSaveAnniversary} size="sm"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs px-4 h-9 rounded-xl shadow-lg shadow-amber-500/30">Save</Button>
                </motion.div>
              )}

              {daysUntilAnniversary !== null ? (
                <div className="flex items-center gap-5">
                  <div className="text-center min-w-[60px]">
                    <motion.div className="text-5xl font-black text-amber-400" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                      {daysUntilAnniversary}
                    </motion.div>
                    <div className="text-[10px] text-white/40 font-medium">days to go</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/65 mb-2 leading-relaxed">
                      {daysUntilAnniversary === 0 ? "🎉 Happy Anniversary! Today is your special day!" :
                       daysUntilAnniversary <= 7 ? "Coming up soon — start planning something special!" :
                       "Keep building memories together every day."}
                    </p>
                    <Progress value={Math.max(0, 100 - (daysUntilAnniversary / 365) * 100)} className="h-1.5 bg-white/10" />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/35 italic">Set your anniversary date to start the countdown.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Habits Chart ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-teal-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/20 rounded-xl border border-violet-400/20">
                    <CalendarDays className="w-4 h-4 text-violet-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Habits & Predictions</h3>
                    <p className="text-[11px] text-white/40">Weekly connection score</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1.5 text-white/50"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 inline-block" />Actual</span>
                  <span className="flex items-center gap-1.5 text-white/50"><span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />Predicted</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={habitData} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[40, 100]} />
                  <Tooltip
                    contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(168,85,247,0.4)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    itemStyle={{ color: "#e879f9" }}
                  />
                  <Line type="monotone" dataKey="connection" stroke="#e879f9" strokeWidth={2.5} dot={{ fill: "#e879f9", r: 3.5 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="predicted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* ── Compliment Wall ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.14) 0%, rgba(244,63,94,0.10) 100%)", border: "1px solid rgba(217,70,239,0.25)" }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-2 text-6xl opacity-[0.04] select-none">💕</div>
              <div className="absolute bottom-2 right-2 text-6xl opacity-[0.04] select-none">🌸</div>
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-fuchsia-500/20 rounded-xl border border-fuchsia-400/20">
                    <Heart className="w-4 h-4 text-fuchsia-300 fill-fuchsia-500/50" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Felt Sense Archive</h3>
                    <p className="text-[11px] text-white/40">Somatic love notes · felt in the body</p>
                  </div>
                </div>
                <button onClick={() => setLocation('/compliment-jar')}
                  className="text-xs font-semibold text-fuchsia-300 hover:text-fuchsia-200 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/25 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" /> Add Note
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "🫁", text: "I love how you make me laugh every single day. That's a ventral vagal gift.", rotate: "-1deg", accent: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.20)" },
                  { emoji: "🛡️", text: "You are the safest nervous system I have ever co-regulated with.", rotate: "1.5deg", accent: "rgba(217,70,239,0.12)", border: "rgba(217,70,239,0.20)" },
                  { emoji: "🌸", text: "Thank you for always believing in me — I feel it in my body.", rotate: "1deg", accent: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.20)" },
                  { emoji: "🧠", text: "You help me heal parts I didn't know still needed it.", rotate: "-1.5deg", accent: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.20)" },
                ].map((note, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 12, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: note.rotate }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ scale: 1.04, rotate: "0deg", y: -3 }}
                    className="p-4 rounded-2xl border cursor-default"
                    style={{ background: note.accent, borderColor: note.border }}>
                    <div className="text-2xl mb-2 leading-none">{note.emoji}</div>
                    <p className="text-xs text-white/80 leading-relaxed italic mb-2">"{note.text}"</p>
                    <p className="text-[10px] text-fuchsia-400/80 font-bold">— felt sense note</p>
                  </motion.div>
                ))}
              </div>
              <p className="text-center text-[10px] text-white/25 mt-4">Write them a felt sense note — words that land in the body, not just the mind</p>
            </div>
          </div>
        </motion.div>

        {/* ── Couple Leaderboard ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(234,88,12,0.10) 100%)", border: "1px solid rgba(245,158,11,0.28)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/25 rounded-xl border border-amber-400/25">
                  <Trophy className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Co-Regulation Streak Board</h3>
                  <p className="text-[11px] text-white/40">Daily connection · nervous system health</p>
                </div>
              </div>
              <button onClick={handleShareProgress}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/25 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5">
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>
            <div className="space-y-2">
              {(() => {
                const topFive = (leaderboardData?.leaderboard || []).slice(0, 4);
                const myEntry = { id: "me", fullName: firstName, streak: streakVal, xp: (gamification as any)?.xp ?? 0, isYou: true };
                const entries = topFive.length > 0 ? [...topFive, myEntry] : [myEntry];
                return entries.map((entry: any, idx: number) => (
                  <div key={entry.id || idx}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${entry.isYou
                      ? "bg-gradient-to-r from-rose-500/20 to-fuchsia-500/15 border border-rose-400/30"
                      : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07]"}`}>
                    <span className="text-lg w-7 text-center">{RANK_BADGES[idx] ?? "⭐"}</span>
                    <span className={`flex-1 text-sm font-semibold truncate ${entry.isYou ? "text-rose-300" : "text-white/80"}`}>
                      {entry.isYou ? (streakVal > 0 ? `${firstName} (You)` : "You (start your streak!)") : (entry.fullName || "Anonymous")}
                    </span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">{entry.streak > 0 ? `${entry.streak}d streak` : "—"}</div>
                      {(entry.xp ?? 0) > 0 && <div className="text-[10px] text-white/30">{entry.xp} XP</div>}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <p className="text-center text-[11px] text-white/25 mt-3">Research shows daily co-regulation repairs nervous system safety — streak = health</p>
          </div>
        </motion.div>

        {/* ── Harmony Affiliate Card ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-5">
          <HarmonyAffiliateCard />
        </motion.div>

        {/* ── Couple Space Divider ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.215 }} className="mb-6 mt-2">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            </div>
            <div className="relative flex justify-center">
              <div className="flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-rose-500/15 to-fuchsia-500/15 border border-rose-400/25 backdrop-blur-sm">
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/60" />
                </motion.div>
                <span className="text-xs font-black text-rose-300 uppercase tracking-widest">Your Couple Space</span>
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/60" />
                </motion.div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/25 mt-2">These features are shared with your partner</p>
        </motion.div>

        {/* ── EchoBond Teaser ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="mb-5">
        <ErrorBoundary fallback={<div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 text-white/40 text-sm text-center">EchoBond unavailable</div>}>
          <motion.div whileHover={{ scale: 1.01, y: -2 }} onClick={() => setLocation("/echobond")}
            className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl cursor-pointer group"
            style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.20) 0%, rgba(168,85,247,0.15) 50%, rgba(99,102,241,0.12) 100%)", border: "1px solid rgba(217,70,239,0.30)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-4">
              <motion.div
                className="p-3.5 bg-gradient-to-br from-fuchsia-500/30 to-violet-500/20 rounded-2xl border border-fuchsia-400/30 flex-shrink-0"
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.06, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <BrainCircuit className="w-7 h-7 text-fuchsia-300" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-white">EchoBond Chamber</h3>
                  <Badge className="bg-fuchsia-500/25 text-fuchsia-300 border-fuchsia-400/35 text-[10px]">Unique</Badge>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mb-3">
                  AI replays your relationship's best moments — reinterpreted from your partner's perspective to build deeper empathy and connection.
                </p>
                <div className="bg-black/30 rounded-xl px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs text-white/45 italic">"Echo from last week: 'I love you' — Reinterpreted: calm reassurance during your most stressful moment."</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/25 flex-shrink-0 mt-1 group-hover:text-fuchsia-300 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </ErrorBoundary>
        </motion.div>

        {/* ── Partner Status ── */}
        <ErrorBoundary fallback={<div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 text-white/40 text-sm text-center mb-5">Partner section unavailable — refresh to retry</div>}>
        <motion.div id="partner-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-teal-500/5 to-cyan-500/5 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/20 rounded-xl border border-violet-400/20"><Users className="w-4 h-4 text-violet-300" /></div>
                <h3 className="text-sm font-bold text-white">Partner Status</h3>
              </div>

              {partnerLoading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-white/60 text-sm">Loading partner status...</span>
                </div>
              ) : partnerStatus?.hasPartner ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span className="text-white font-semibold">Linked with {partnerStatus.partnerName}</span>
                    </div>
                    <Badge className={`border ${partnerStatus.partnerAssessmentComplete ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border-amber-400/30"}`}>
                      {partnerStatus.partnerAssessmentComplete ? "Assessment Complete" : "Assessment Pending"}
                    </Badge>
                  </div>
                  {partnerStatus.compatibility !== undefined && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/60 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400" /> Compatibility Score</span>
                        <span className="text-sm font-bold text-rose-400">{partnerStatus.compatibility}%</span>
                      </div>
                      <Progress value={partnerStatus.compatibility} className="h-2 bg-white/10" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setLocation("/couple-coaching")}
                      className="bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-400 hover:to-fuchsia-500 text-white font-bold rounded-full shadow-xl shadow-rose-500/30 hover:-translate-y-0.5 transition-all">
                      <Sparkles className="w-4 h-4 mr-2" /> Start Couple Coaching
                    </Button>
                    <Button onClick={() => setLocation("/relationship-coach")} variant="outline"
                      className="border-rose-400/30 text-rose-300 hover:bg-rose-500/10 rounded-full">
                      <Heart className="w-4 h-4 mr-2" /> Compatibility
                    </Button>
                    <Button onClick={() => setShowGiftPanel(v => !v)} variant="outline"
                      className="border-fuchsia-400/30 text-fuchsia-300 hover:bg-fuchsia-500/10 rounded-full">
                      <Gift className="w-4 h-4 mr-2" /> Send a Gift
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showGiftPanel && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="pt-2 space-y-3">
                          <p className="text-xs text-fuchsia-300/70">Choose a gift to send to {partnerStatus.partnerName}:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {GIFTS.map(g => (
                              <button key={g.type} onClick={() => setSelectedGiftType(prev => prev === g.type ? null : g.type)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${selectedGiftType === g.type ? "border-fuchsia-400/60 bg-fuchsia-500/20" : "border-white/10 bg-white/[0.04] hover:border-fuchsia-400/35 hover:bg-fuchsia-500/10"}`}>
                                <span className="text-2xl">{g.emoji}</span>
                                <span className="text-xs text-white font-semibold leading-tight">{g.label}</span>
                                <span className="text-xs text-fuchsia-300 font-bold">{g.price}</span>
                              </button>
                            ))}
                          </div>
                          {selectedGiftType && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                              <p className="text-xs text-white/50">{GIFTS.find(g => g.type === selectedGiftType)?.desc}</p>
                              <Input value={giftMessage} onChange={e => setGiftMessage(e.target.value)} placeholder="Add a sweet message (optional)..."
                                className="bg-black/30 border-fuchsia-400/30 text-white placeholder:text-fuchsia-300/30 text-sm rounded-xl" />
                              <Button onClick={() => sendGiftMutation.mutate({ giftType: selectedGiftType, message: giftMessage })} disabled={sendGiftMutation.isPending}
                                className="w-full bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-400 hover:to-fuchsia-500 text-white font-bold rounded-full shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 transition-all">
                                {sendGiftMutation.isPending ? "Opening checkout..." : `Send ${GIFTS.find(g => g.type === selectedGiftType)?.emoji} via Stripe`}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-white font-bold text-sm">Invite Your Partner by Email</h4>
                    <p className="text-xs text-white/45">We'll send them a direct invitation link — no code sharing needed.</p>
                    <div className="flex gap-2">
                      <Input value={partnerEmailInvite} onChange={(e) => setPartnerEmailInvite(e.target.value)} placeholder="partner@email.com" type="email"
                        className="flex-1 bg-black/30 border-violet-400/40 text-white placeholder:text-violet-300/35 text-sm rounded-xl" />
                      <Button onClick={() => emailInviteMutation.mutate(partnerEmailInvite)} disabled={!partnerEmailInvite.trim() || emailInviteMutation.isPending}
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 whitespace-nowrap">
                        {emailInviteMutation.isPending ? "Sending..." : "Send Invite"}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                    <div className="relative flex justify-center"><span className="bg-transparent px-3 text-xs text-white/25">or use a code</span></div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-white/80 font-semibold text-sm">Get an Invite Code</h4>
                      {partnerStatus?.inviteCode ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-black/30 border border-violet-400/40 rounded-xl px-3 py-2 font-mono text-violet-300 text-sm truncate">{partnerStatus.inviteCode}</div>
                          <Button onClick={() => copyInviteCode(partnerStatus.inviteCode!)} className="bg-violet-500/25 hover:bg-violet-500/40 text-violet-200 rounded-xl border border-violet-400/30" size="icon">
                            {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending} size="sm"
                          className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-400/30 rounded-xl">
                          <Link2 className="w-3.5 h-3.5 mr-1.5" />
                          {createInviteMutation.isPending ? "Creating..." : "Generate Code"}
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 md:border-l md:border-white/[0.06] md:pl-4">
                      <h4 className="text-white/80 font-semibold text-sm">Have a Code?</h4>
                      <div className="flex gap-2">
                        <Input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value.toUpperCase())} placeholder="PARTNER-XX-XXX"
                          className="flex-1 bg-black/30 border-violet-400/40 text-white placeholder:text-violet-300/35 text-sm rounded-xl" />
                        <Button onClick={() => acceptInviteMutation.mutate(partnerCode)} disabled={!partnerCode.trim() || acceptInviteMutation.isPending}
                          className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold rounded-xl">
                          {acceptInviteMutation.isPending ? "..." : "Link"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </ErrorBoundary>

        {/* ── Daily Couple Challenges ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.16) 0%, rgba(234,88,12,0.10) 100%)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/25 rounded-xl border border-amber-400/25">
                  <Trophy className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Today's Couple Challenges</h3>
                  <p className="text-[11px] text-white/40">Resets at midnight</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-400">{totalPoints}/{maxPoints} pts</div>
                <div className="text-[10px] text-white/30">{completedChallenges.size}/{couplesChallenges.length} done</div>
              </div>
            </div>

            {completedChallenges.size > 0 && (
              <Progress value={(totalPoints / maxPoints) * 100} className="h-2 mb-4 bg-white/10" />
            )}

            <div className="space-y-2">
              {couplesChallenges.map((challenge) => {
                const done = completedChallenges.has(challenge.id);
                const Icon = challenge.icon;
                return (
                  <motion.div key={challenge.id} layout onClick={() => toggleChallenge(challenge.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer select-none ${done
                      ? `${challenge.bg} ${challenge.border}`
                      : "bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.08] hover:border-white/[0.12]"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? challenge.bg : "bg-white/[0.07]"}`}>
                      {done ? <CheckCircle2 className={`w-4.5 h-4.5 ${challenge.color}`} /> : <Icon className="w-4 h-4 text-white/40" />}
                    </div>
                    <span className={`flex-1 text-sm font-medium transition-all ${done ? "line-through text-white/35" : "text-white/80"}`}>{challenge.title}</span>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${done ? `${challenge.border} ${challenge.color}` : "border-amber-400/30 text-amber-300"}`}>
                      {done ? "✓" : `+${challenge.points}`}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>

            {completedChallenges.size === couplesChallenges.length && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/15 border border-amber-400/30 text-center">
                <p className="text-sm text-amber-300 font-bold">🎉 All challenges complete for today!</p>
                <p className="text-xs text-white/40 mt-0.5">Come back tomorrow for new ones</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── Recording Analysis ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.245 }} className="mb-5">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-rose-500/5 pointer-events-none" />
            <div className="relative">
              <AudioAnalyzer mode="harmony" />
            </div>
          </div>
        </motion.div>

        {/* ── Quick Launch ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-fuchsia-500/20 rounded-lg">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400" />
            </div>
            <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Quick Launch</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {QUICK_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.button key={tool.path} whileHover={{ scale: 1.08, y: -5 }} whileTap={{ scale: 0.93 }}
                  onClick={() => setLocation(tool.path)}
                  className={`relative flex flex-col items-center gap-2.5 p-4 rounded-3xl bg-gradient-to-br ${tool.color} shadow-xl ${tool.shadow} overflow-hidden group`}>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/15 transition-colors duration-200" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
                  <div className="relative">
                    <Icon className="w-6 h-6 text-white drop-shadow-sm" />
                    {tool.badge && (
                      <span className="absolute -top-2.5 -right-3.5 text-[9px] bg-white/35 text-white px-1.5 rounded-full font-black backdrop-blur-sm">{tool.badge}</span>
                    )}
                  </div>
                  <span className="relative text-[11px] font-bold text-white text-center leading-tight">{tool.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Harmony Affiliate Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.255 }}
          className="mb-8"
        >
          <HarmonyAffiliateCard />
        </motion.div>

        {/* ── Mental Load of Sex ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.257 }} className="mb-8">
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/20 rounded-xl border border-violet-400/20">
                  <Brain className="w-4 h-4 text-violet-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">The Mental Load of Sex</h3>
                  <p className="text-[11px] text-white/40">Coaching for couples on desire & initiation</p>
                </div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-4">
                Sex and intimacy have a cognitive load — the invisible work of managing initiation, desire, rejection, and emotional safety. When it's unequally distributed, resentment follows. Here's how to talk about it as a couple.
              </p>

              {/* Facts */}
              <div className="space-y-2.5 mb-5">
                {MENTAL_LOAD_FACTS.map((fact, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 p-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                    <span className="text-lg flex-shrink-0">{fact.emoji}</span>
                    <p className="text-xs text-white/65 leading-relaxed">{fact.fact}</p>
                  </motion.div>
                ))}
              </div>

              {/* Practical Tools */}
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Practical Tools for Both of You
              </h4>
              <div className="space-y-2.5">
                {MENTAL_LOAD_TOOLS.map(tool => {
                  const done = completedMentalLoadTools.has(tool.id);
                  return (
                    <motion.div key={tool.id} whileHover={{ scale: 1.01 }}
                      onClick={() => toggleMentalLoadTool(tool.id)}
                      className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                        done ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                      }`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{tool.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">{tool.label}</span>
                            {done && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-white/55 leading-relaxed">{tool.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 border border-violet-400/20">
                <p className="text-white/80 text-sm font-semibold mb-1">Want to talk through this together?</p>
                <p className="text-white/45 text-xs mb-3 leading-relaxed">
                  Harmony's AI Relationship Coach can guide you both through a live conversation about desire, initiation, and intimacy. Safe, private, no judgment.
                </p>
                <button onClick={() => setLocation('/harmony-pro')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-violet-500/30 hover:from-violet-400 hover:to-fuchsia-500 transition-all">
                  <Heart className="w-3.5 h-3.5" /> Open Harmony Coach
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Feature Categories ── */}
        <ErrorBoundary fallback={<div className="rounded-2xl p-4 bg-white/[0.04] border border-white/10 text-white/40 text-sm text-center mb-5">Tools section unavailable — refresh to retry</div>}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mb-8 space-y-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-fuchsia-500/30 to-violet-500/20 rounded-xl border border-fuchsia-400/25 shadow-lg shadow-fuchsia-500/20">
                <Sparkles className="w-4 h-4 text-fuchsia-300" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">All Relationship Tools</h2>
                <p className="text-[11px] text-white/35">Everything you need — in one place</p>
              </div>
            </div>
            <Badge className="bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/25 text-[10px] font-bold">
              {featureCategories.reduce((a, c) => a + c.cards.length, 0)} Tools
            </Badge>
          </div>

          {featureCategories.map((category) => {
            const CatIcon = category.icon;
            return (
              <div key={category.label}>
                {category.label === "Optional Assessments" && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-gradient-to-r from-violet-500/40 to-indigo-500/20" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/20">
                        <Lock className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">Your Private Side</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-l from-violet-500/40 to-indigo-500/20" />
                    </div>
                    <p className="text-center text-[10px] text-white/25 mt-1.5">These results are yours alone — never shared with your partner</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-1 h-5 rounded-full bg-gradient-to-b ${category.accent}`} />
                  <CatIcon className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{category.label}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {category.cards.map((card) => {
                    const Icon = card.icon;
                    const handleCardClick = () => {
                      if ((card as any).external) window.open(card.path, "_blank", "noopener noreferrer");
                      else setLocation(card.path);
                    };
                    return (
                      <motion.div key={card.path + card.title} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                        onClick={handleCardClick}
                        className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer group backdrop-blur-xl transition-all duration-300 hover:shadow-2xl ${card.glow}`}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
                        <div className="relative">
                          {card.badge && (
                            <div className="absolute -top-1 -right-1">
                              <Badge className={`text-white border-0 text-[10px] px-1.5 py-0 font-bold ${
                                card.badge === 'New'         ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500'
                                : card.badge === 'Hot'      ? 'bg-gradient-to-r from-rose-500 to-pink-600'
                                : card.badge === 'Unique'   ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600'
                                : card.badge === 'Viral'    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : card.badge === 'Core'     ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                : card.badge === 'AI'       ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
                                : card.badge === 'Fun'      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : card.badge === 'Loving'   ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500'
                                : card.badge === '16 Tests' ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
                                : card.badge === 'Daily'    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                                : card.badge === 'Essential'? 'bg-gradient-to-r from-red-500 to-rose-600'
                                : card.badge === 'Insightful'? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                : card.badge === 'Groupon'  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                : 'bg-gradient-to-r from-fuchsia-500 to-violet-500'
                              }`}>{card.badge}</Badge>
                            </div>
                          )}
                          <div className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-white/[0.08]`}>
                            <Icon className={`w-5 h-5 ${card.iconColor}`} />
                          </div>
                          <h3 className="text-sm font-bold text-white mb-1 leading-tight group-hover:text-white transition-colors">{card.title}</h3>
                          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">{card.description}</p>
                          <div className="mt-3 flex items-center gap-1 text-white/30 text-[11px] font-semibold group-hover:text-white/60 transition-colors">
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
        </ErrorBoundary>

        {/* ── Switch Mode Footer ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center py-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/25 mb-3">Looking for matches instead?</p>
          <Button onClick={() => setLocation("/eros-hub")} variant="ghost"
            className="text-white/40 hover:text-white/70 hover:bg-white/[0.06] text-sm font-medium gap-2 rounded-xl">
            Switch to Matching Mode <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

      </div>

      {harmonyVoiceOpen && (
        <RealtimeVoiceChat persona="harmony" onClose={() => setHarmonyVoiceOpen(false)} />
      )}
    </div>
  );
}
