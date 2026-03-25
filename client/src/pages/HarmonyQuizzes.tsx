import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Brain, CheckCircle2, Heart, Sparkles,
  MessageSquare, Shield, Flame, Users, Scale, Star, Trophy, RefreshCw,
  HeartHandshake, Zap, BookOpen, Check
} from 'lucide-react';

const HARMONY_OPTION_COLORS = [
  { bg: 'from-red-500/20 to-red-600/10',         border: 'border-red-500/50',    badge: 'bg-red-500 text-white',      glow: 'shadow-red-900/40' },
  { bg: 'from-orange-500/20 to-orange-600/10',   border: 'border-orange-500/50', badge: 'bg-orange-500 text-white',   glow: 'shadow-orange-900/40' },
  { bg: 'from-slate-500/20 to-slate-600/10',     border: 'border-slate-400/40',  badge: 'bg-slate-500 text-white',   glow: 'shadow-slate-900/40' },
  { bg: 'from-teal-500/20 to-teal-600/10',       border: 'border-teal-500/50',   badge: 'bg-teal-500 text-white',    glow: 'shadow-teal-900/40' },
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/50',badge: 'bg-emerald-500 text-white', glow: 'shadow-emerald-900/40' },
];

type HarmonyQuizId =
  'relationship_satisfaction' | 'love_languages' | 'gottman_conflict' |
  'attachment_in_rel' | 'communication_quality' | 'emotional_intimacy' |
  'trust_scale' | 'conflict_resolution' | 'shared_values' | 'rel_expectations' |
  'jealousy' | 'forgiveness' | 'future_vision' | 'appreciation' |
  'intimacy_needs' | 'financial_values' | 'partnership_balance' |
  'stress_coping' | 'intimacy_values' | 'rel_readiness' |
  'parenting_alignment' | 'social_compatibility';

interface QuizQuestion { id: number; text: string; isLikert?: boolean; }
interface HarmonyQuizDef {
  id: HarmonyQuizId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  emoji: string;
  desc: string;
  duration: string;
  category: 'Relationship' | 'Personality' | 'Conflict' | 'Intimacy' | 'Compatibility';
  questions: QuizQuestion[];
  scorer: (answers: Record<number, number>) => Record<string, number>;
  interpreter: (scores: Record<string, number>) => string[];
}

const LIKERT_LABELS = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

const HARMONY_QUIZZES: HarmonyQuizDef[] = [
  {
    id: 'relationship_satisfaction',
    title: 'Relationship Satisfaction',
    subtitle: 'How fulfilling is your relationship?',
    icon: Heart,
    color: 'from-rose-700 to-pink-800',
    glow: 'border-rose-600/30',
    emoji: '💕',
    desc: 'Based on the Relationship Assessment Scale (Hendrick), this measures your overall satisfaction with your relationship across key dimensions.',
    duration: '4 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'My partner meets my needs.', isLikert: true },
      { id: 2, text: 'In general, I am satisfied with my relationship.', isLikert: true },
      { id: 3, text: 'A good relationship is one of the most important things in my life.', isLikert: true },
      { id: 4, text: 'My partner and I handle our problems and disagreements well.', isLikert: true },
      { id: 5, text: 'I do not wish I had a different kind of partner.', isLikert: true },
      { id: 6, text: 'I feel my relationship is strong and stable.', isLikert: true },
      { id: 7, text: 'I would recommend my relationship as a model for others.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (7 * 5)) * 100);
      return {
        overall,
        needsMet: (answers[1]||3) * 20,
        stability: Math.round(((answers[2]||3) + (answers[6]||3)) / 2 * 20),
        conflictHandling: (answers[4]||3) * 20,
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 75) insights.push('High satisfaction: Your relationship is a genuine source of fulfillment. The work now is sustaining what\'s built and growing together intentionally.');
      else if (scores.overall >= 50) insights.push('Moderate satisfaction: There\'s real connection here alongside areas that feel unfulfilling. Naming those areas specifically is the first step.');
      else insights.push('Lower satisfaction: This score reflects a relationship that\'s not meeting your deeper needs right now. This is important information — not a verdict.');
      if (scores.conflictHandling < 55) insights.push('How you handle disagreements is one of the highest-leverage areas for relationship improvement. Gottman\'s research shows it predicts long-term success better than love intensity.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'love_languages',
    title: 'Love Languages',
    subtitle: 'How you give and receive love',
    icon: Heart,
    color: 'from-pink-700 to-rose-800',
    glow: 'border-pink-600/30',
    emoji: '💌',
    desc: 'Based on Gary Chapman\'s framework. Understanding your love language — and your partner\'s — is one of the most practical relationship tools available.',
    duration: '5 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'Receiving verbal affirmations and compliments from my partner means more to me than gifts.', isLikert: true },
      { id: 2, text: 'Spending focused, undivided time together is how I feel most loved.', isLikert: true },
      { id: 3, text: 'Physical touch — holding hands, hugs, closeness — is central to how I feel connected.', isLikert: true },
      { id: 4, text: 'When my partner does something helpful without being asked, I feel deeply cared for.', isLikert: true },
      { id: 5, text: 'Thoughtful gifts, even small ones, communicate love and effort to me.', isLikert: true },
      { id: 6, text: 'I feel disconnected when I don\'t hear "I love you" or similar words regularly.', isLikert: true },
      { id: 7, text: 'I feel most connected when we share experiences and focus on each other.', isLikert: true },
      { id: 8, text: 'Non-sexual physical affection is essential to my emotional connection.', isLikert: true },
      { id: 9, text: 'My partner taking tasks off my plate is a deep expression of love to me.', isLikert: true },
      { id: 10, text: 'A meaningful gift that shows my partner was thinking of me makes me feel very special.', isLikert: true },
    ],
    scorer: (answers) => ({
      wordsOfAffirmation: Math.round(((answers[1]||3) + (answers[6]||3)) / 2 * 20),
      qualityTime: Math.round(((answers[2]||3) + (answers[7]||3)) / 2 * 20),
      physicalTouch: Math.round(((answers[3]||3) + (answers[8]||3)) / 2 * 20),
      actsOfService: Math.round(((answers[4]||3) + (answers[9]||3)) / 2 * 20),
      receivingGifts: Math.round(((answers[5]||3) + (answers[10]||3)) / 2 * 20),
    }),
    interpreter: (scores) => {
      const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
      const top = sorted[0][0];
      const map: Record<string, string> = {
        wordsOfAffirmation: 'Words of Affirmation is your primary language — spoken appreciation, "I love you," and verbal recognition fill your emotional tank.',
        qualityTime: 'Quality Time is your primary language — undivided attention, shared experiences, and genuine presence are how you feel most loved.',
        physicalTouch: 'Physical Touch is your primary language — closeness, holding hands, and non-verbal physical connection are your deepest expressions of love.',
        actsOfService: 'Acts of Service is your primary language — when your partner takes action to ease your load or show care, that speaks loudest.',
        receivingGifts: 'Receiving Gifts is your primary language — thoughtful tokens of affection communicate "I was thinking of you" in a way that deeply resonates.',
      };
      return [map[top] || 'Your love language profile is nuanced.', 'Knowing your partner\'s love language — and speaking it intentionally — is more effective than expressing love in the way you prefer to receive it.'];
    },
  },
  {
    id: 'gottman_conflict',
    title: 'Gottman Four Horsemen',
    subtitle: 'The relationship warning signs',
    icon: Shield,
    color: 'from-red-700 to-orange-800',
    glow: 'border-red-600/30',
    emoji: '🛡️',
    desc: 'John Gottman\'s research identified four communication patterns that predict relationship dissolution with 93% accuracy. This assessment helps you recognize them in your own relationship.',
    duration: '5 min',
    category: 'Conflict',
    questions: [
      { id: 1, text: 'During arguments, I often attack my partner\'s character or personality, not just the behavior.', isLikert: true },
      { id: 2, text: 'I feel contempt toward my partner sometimes — rolling my eyes, mocking, or feeling superior.', isLikert: true },
      { id: 3, text: 'When my partner raises a complaint, I often defend myself before trying to understand them.', isLikert: true },
      { id: 4, text: 'I shut down or go silent during conflict to avoid saying something I\'ll regret.', isLikert: true },
      { id: 5, text: 'We start difficult conversations with mutual respect rather than blame.', isLikert: true },
      { id: 6, text: 'I can tell when my partner is genuinely hurting and I adjust my approach.', isLikert: true },
      { id: 7, text: 'When I feel flooded (overwhelmed), I ask to pause and we both agree to it.', isLikert: true },
      { id: 8, text: 'I find myself making global statements like "you always" or "you never" during arguments.', isLikert: true },
    ],
    scorer: (answers) => ({
      criticism: (answers[1]||3) * 20,
      contempt: (answers[2]||3) * 20,
      defensiveness: (answers[3]||3) * 20,
      stonewalling: (answers[4]||3) * 20,
      repair: Math.round(((answers[5]||3) + (answers[6]||3) + (answers[7]||3)) / 3 * 20),
      healthScore: Math.round((6-(answers[1]||3) + 6-(answers[2]||3) + 6-(answers[3]||3) + 6-(answers[4]||3) + (answers[5]||3) + (answers[6]||3) + (answers[7]||3)) / 7 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.contempt >= 60) insights.push('Contempt is the single most destructive relationship pattern — it communicates disgust and moral superiority. Rebuilding a culture of appreciation and fondness is the antidote.');
      if (scores.criticism >= 60) insights.push('High criticism: Try switching from "you always X" to "I feel Y when Z" — this complaint structure attacks behavior, not character.');
      if (scores.repair >= 70) insights.push('Strong repair capacity: Your ability to de-escalate and reconnect after conflict is a powerful relationship asset — Gottman says this matters more than the horsemen themselves.');
      if (scores.healthScore >= 65) insights.push('Your conflict profile is relatively healthy. Continue investing in "softened start-up" — how you bring up difficult topics shapes the entire conversation.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'attachment_in_rel',
    title: 'Attachment in Relationships',
    subtitle: 'Your bond and security pattern',
    icon: HeartHandshake,
    color: 'from-violet-700 to-purple-800',
    glow: 'border-violet-600/30',
    emoji: '🔗',
    desc: 'Adult attachment theory (Hazan & Shaver) explains how early bonding experiences shape how you relate in romantic partnerships. Understanding your style is transformative.',
    duration: '5 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'I feel comfortable depending on my partner and having them depend on me.', isLikert: true },
      { id: 2, text: 'I worry my partner doesn\'t love me as much as I love them.', isLikert: true },
      { id: 3, text: 'I find it difficult to let myself fully depend on another person romantically.', isLikert: true },
      { id: 4, text: 'I find it easy to be emotionally close and intimate with my partner.', isLikert: true },
      { id: 5, text: 'I often worry my partner will abandon me.', isLikert: true },
      { id: 6, text: 'I feel uncomfortable when my partner wants to be very emotionally close.', isLikert: true },
      { id: 7, text: 'I do not worry often about being alone or having partners not accept me.', isLikert: true },
      { id: 8, text: 'I prefer to not share too much about my inner world with my partner.', isLikert: true },
      { id: 9, text: 'I know my partner will be there when I need them.', isLikert: true },
      { id: 10, text: 'I get frustrated when my partner wants more closeness than I\'m comfortable with.', isLikert: true },
    ],
    scorer: (answers) => ({
      secure: Math.round(((answers[1]||3) + (answers[4]||3) + (answers[7]||3) + (answers[9]||3)) / 4 * 20),
      anxious: Math.round(((answers[2]||3) + (answers[5]||3)) / 2 * 20),
      avoidant: Math.round(((answers[3]||3) + (answers[6]||3) + (answers[8]||3) + (answers[10]||3)) / 4 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      const dominant = scores.secure >= scores.anxious && scores.secure >= scores.avoidant ? 'secure' : scores.anxious > scores.avoidant ? 'anxious' : 'avoidant';
      const map = {
        secure: 'Secure attachment: You can be close and independent. You trust your partner and communicate needs directly. This is the most stable relational foundation.',
        anxious: 'Anxious attachment: You crave closeness but fear abandonment. Your nervous system is hypervigilant to relationship threats. Self-soothing skills and clear communication of needs (not demands) help enormously.',
        avoidant: 'Avoidant attachment: You value independence and get uncomfortable with too much closeness. This isn\'t coldness — it\'s a protective adaptation. Slowly increasing vulnerability in safe moments is the path forward.',
      };
      insights.push(map[dominant]);
      insights.push('Attachment styles are not permanent. They shift through consistent, safe relational experiences — and through choosing a partner who can meet you where you are.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'communication_quality',
    title: 'Communication Quality',
    subtitle: 'How well do you really hear each other?',
    icon: MessageSquare,
    color: 'from-blue-700 to-indigo-800',
    glow: 'border-blue-600/30',
    emoji: '💬',
    desc: 'Based on the Communication Patterns Questionnaire (Christensen & Sullaway). Healthy communication is the single most cited factor in relationship longevity.',
    duration: '4 min',
    category: 'Conflict',
    questions: [
      { id: 1, text: 'We talk openly about our feelings, even difficult ones, without fear of judgment.', isLikert: true },
      { id: 2, text: 'My partner listens to understand me, not just to respond.', isLikert: true },
      { id: 3, text: 'I feel heard and understood by my partner most of the time.', isLikert: true },
      { id: 4, text: 'We avoid important conversations because they tend to escalate.', isLikert: true },
      { id: 5, text: 'I can tell my partner something is wrong and they will genuinely try to understand.', isLikert: true },
      { id: 6, text: 'We interrupt each other or talk over each other during arguments.', isLikert: true },
      { id: 7, text: 'After difficult conversations, we feel closer rather than more distant.', isLikert: true },
      { id: 8, text: 'We use "I" statements to express feelings rather than blaming "you" statements.', isLikert: true },
    ],
    scorer: (answers) => {
      const openness = Math.round(((answers[1]||3) + (answers[3]||3) + (answers[5]||3)) / 3 * 20);
      const listening = Math.round(((answers[2]||3)) * 20);
      const avoidance = Math.round((6-(answers[4]||3)) * 20);
      const repair = Math.round(((answers[7]||3) + (answers[8]||3)) / 2 * 20);
      const overall = Math.round((openness + listening + avoidance + repair) / 4);
      return { overall, openness, activeListening: listening, conflictAvoidance: avoidance, repairSkills: repair };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong communication: You and your partner have built real channels of understanding. This is the infrastructure for navigating anything together.');
      else if (scores.overall >= 50) insights.push('Adequate communication: You\'re getting the basics right but there are gaps. Try "reflective listening" — summarize what your partner said before responding.');
      else insights.push('Communication breakdown: Critical conversations are being avoided or mishandled. Professional support (even 3 sessions) can transform this pattern quickly.');
      if (scores.activeListening < 55) insights.push('Active listening — reflecting back what your partner said before adding your own response — is the single highest-leverage communication skill you can build.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'emotional_intimacy',
    title: 'Emotional Intimacy Scale',
    subtitle: 'The depth of your connection',
    icon: Flame,
    color: 'from-fuchsia-700 to-pink-800',
    glow: 'border-fuchsia-600/30',
    emoji: '🔥',
    desc: 'Emotional intimacy — feeling truly known and accepted — is the foundation of lasting romantic love. This scale measures the depth of your current emotional bond.',
    duration: '4 min',
    category: 'Intimacy',
    questions: [
      { id: 1, text: 'I can share my deepest feelings with my partner without fear of being judged.', isLikert: true },
      { id: 2, text: 'My partner knows the "real" me — including the parts I usually hide from others.', isLikert: true },
      { id: 3, text: 'I feel emotionally safe with my partner.', isLikert: true },
      { id: 4, text: 'We can sit in silence together and feel connected, not disconnected.', isLikert: true },
      { id: 5, text: 'My partner shares their inner world — fears, dreams, and vulnerabilities — with me.', isLikert: true },
      { id: 6, text: 'I feel truly understood by my partner.', isLikert: true },
      { id: 7, text: 'We have rituals of connection that keep us emotionally close (check-ins, traditions, etc.).', isLikert: true },
      { id: 8, text: 'When I am struggling, my partner is my first call.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        vulnerability: Math.round(((answers[1]||3) + (answers[2]||3)) / 2 * 20),
        safety: Math.round(((answers[3]||3) + (answers[6]||3)) / 2 * 20),
        rituals: Math.round(((answers[4]||3) + (answers[7]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 75) insights.push('Deep emotional intimacy: You and your partner have built something rare — genuine mutual knowing. This is the most durable form of attraction.');
      else if (scores.overall >= 50) insights.push('Moderate emotional intimacy: There\'s real connection here with room to deepen. Vulnerability — sharing something you\'ve never told them — is the fastest path to depth.');
      else insights.push('Emotional distance: This can be painful. Intimacy is built through small, consistent moments of sharing and being received. Start with what feels safe, not what\'s hardest.');
      if (scores.rituals < 55) insights.push('Gottman\'s research shows daily rituals of connection (even 6-second kisses, asking about their day with genuine curiosity) predict long-term relationship quality more than vacations.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'trust_scale',
    title: 'Relationship Trust Scale',
    subtitle: 'The foundation everything is built on',
    icon: Shield,
    color: 'from-emerald-700 to-teal-800',
    glow: 'border-emerald-600/30',
    emoji: '🤝',
    desc: 'Trust (Rempel & Holmes) encompasses predictability, dependability, and faith in your partner\'s goodwill. Without it, no other strength sustains.',
    duration: '4 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'My partner is completely honest with me.', isLikert: true },
      { id: 2, text: 'I can rely on my partner to do what they say they will do.', isLikert: true },
      { id: 3, text: 'Even when my partner does something that hurts me, I believe it was not intentional.', isLikert: true },
      { id: 4, text: 'I believe my partner genuinely has my best interests at heart.', isLikert: true },
      { id: 5, text: 'I would not hesitate to trust my partner with something important to me.', isLikert: true },
      { id: 6, text: 'I feel confident my partner is faithful to me.', isLikert: true },
      { id: 7, text: 'There are things my partner does that I find suspicious or concerning.', isLikert: true },
      { id: 8, text: 'My partner follows through even when it\'s inconvenient.', isLikert: true },
    ],
    scorer: (answers) => ({
      overall: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[3]||3) + (answers[4]||3) + (answers[5]||3) + (answers[6]||3) + (6-(answers[7]||3)) + (answers[8]||3)) / 8 * 20),
      honesty: Math.round(((answers[1]||3) + (answers[5]||3)) / 2 * 20),
      reliability: Math.round(((answers[2]||3) + (answers[8]||3)) / 2 * 20),
      goodwill: Math.round(((answers[3]||3) + (answers[4]||3)) / 2 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 75) insights.push('Strong foundation of trust: This is the bedrock of a sustainable relationship. Protect it by continuing to do what you say, say what you mean, and assume good intent first.');
      else if (scores.overall >= 50) insights.push('Moderate trust: Trust exists but may have fractures. Each small kept promise rebuilds it; each broken one costs more than it appears to.');
      else insights.push('Low trust: A relationship with compromised trust is painful and exhausting. Rebuilding it requires transparency, consistency over time, and often professional support — but it is possible.');
      if (scores.goodwill < 55) insights.push('Assuming malicious intent (vs. incompetence or different priorities) is one of the most corrosive trust-eroding patterns. Ask yourself: is the most charitable explanation possible?');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'conflict_resolution',
    title: 'Conflict Resolution Style',
    subtitle: 'How you fight — and how you fix it',
    icon: Scale,
    color: 'from-amber-700 to-orange-800',
    glow: 'border-amber-600/30',
    emoji: '⚖️',
    desc: 'Based on Thomas-Kilmann conflict modes. Knowing your default conflict style — and your partner\'s — prevents most escalations before they start.',
    duration: '4 min',
    category: 'Conflict',
    questions: [
      { id: 1, text: 'During disagreements, I try to find solutions that fully satisfy both of us.', isLikert: true },
      { id: 2, text: 'I often avoid conflicts because they feel too stressful or risky.', isLikert: true },
      { id: 3, text: 'When we disagree, I tend to stand firm on what I want until my partner comes around.', isLikert: true },
      { id: 4, text: 'I often give in to keep the peace, even when I don\'t agree.', isLikert: true },
      { id: 5, text: 'I look for middle-ground solutions where we both give something up.', isLikert: true },
      { id: 6, text: 'I express my concerns clearly and then genuinely listen to my partner\'s perspective.', isLikert: true },
      { id: 7, text: 'After a fight, I take initiative to reconnect and repair.', isLikert: true },
      { id: 8, text: 'I feel conflict is useful — it helps us understand each other better.', isLikert: true },
    ],
    scorer: (answers) => ({
      collaborating: Math.round(((answers[1]||3) + (answers[6]||3) + (answers[8]||3)) / 3 * 20),
      avoiding: (answers[2]||3) * 20,
      competing: (answers[3]||3) * 20,
      accommodating: (answers[4]||3) * 20,
      compromising: Math.round(((answers[5]||3) + (answers[7]||3)) / 2 * 20),
    }),
    interpreter: (scores) => {
      const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
      const dominant = sorted[0][0];
      const map: Record<string, string> = {
        collaborating: 'Collaborating style: You seek win-win solutions — the highest form of conflict engagement. The risk is perfectionism when compromise would serve everyone better.',
        avoiding: 'Avoiding style: You reduce tension by stepping back — but unresolved issues compound over time. Practice naming what you need before withdrawing.',
        competing: 'Competing style: You prioritize outcomes over harmony. This can feel win/lose to your partner. Ask yourself: is being right worth the relational cost?',
        accommodating: 'Accommodating style: You keep the peace by giving in — but resentment accumulates from unexpressed needs. Your needs matter equally.',
        compromising: 'Compromising style: You seek fair middle ground — a reliable baseline. Upgrade toward collaboration by exploring what would make both of you genuinely satisfied.',
      };
      return [map[dominant] || 'Your conflict style is nuanced.', 'Repair attempts — reaching for your partner mid-fight — are more predictive of relationship health than the conflict style itself.'];
    },
  },
  {
    id: 'shared_values',
    title: 'Shared Values Assessment',
    subtitle: 'What you both actually believe',
    icon: Star,
    color: 'from-yellow-700 to-amber-800',
    glow: 'border-yellow-600/30',
    emoji: '⭐',
    desc: 'Value alignment (not just preference matching) predicts long-term compatibility. This explores the values that matter most in a shared life.',
    duration: '4 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We have deeply similar values about what a good life looks like.', isLikert: true },
      { id: 2, text: 'We agree on how to handle money — saving, spending, and giving.', isLikert: true },
      { id: 3, text: 'We share similar views on religion, spirituality, or meaning.', isLikert: true },
      { id: 4, text: 'We agree on how important ambition and career are vs. time at home.', isLikert: true },
      { id: 5, text: 'We have similar values about how children should be raised.', isLikert: true },
      { id: 6, text: 'We agree on the role of family and extended relationships in our life.', isLikert: true },
      { id: 7, text: 'Our political or social values are compatible enough to not create ongoing conflict.', isLikert: true },
      { id: 8, text: 'We share a similar vision of what "success" means — what we\'re building toward.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        lifeVision: Math.round(((answers[1]||3) + (answers[8]||3)) / 2 * 20),
        financial: (answers[2]||3) * 20,
        family: Math.round(((answers[5]||3) + (answers[6]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 75) insights.push('Strong value alignment: You\'re building on compatible foundations. This doesn\'t mean identical — healthy relationships have room for difference within shared core values.');
      else if (scores.overall >= 50) insights.push('Partial alignment: Some values overlap, others diverge. The key is distinguishing dealbreakers from preferences — and having honest conversations about both.');
      else insights.push('Value divergence: Significant misalignment in core values creates ongoing friction. This doesn\'t mean incompatible — it means explicit conversations are essential, not optional.');
      if (scores.financial < 55) insights.push('Financial value misalignment is the leading cause of relationship conflict. Explicit, recurring "money dates" normalize the conversation before it becomes a crisis.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'rel_expectations',
    title: 'Relationship Expectations',
    subtitle: 'The unspoken rules between you',
    icon: BookOpen,
    color: 'from-indigo-700 to-blue-800',
    glow: 'border-indigo-600/30',
    emoji: '📋',
    desc: 'Unmet expectations are the source of most relationship disappointment. This survey helps surface assumptions that are often never spoken aloud.',
    duration: '4 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We have discussed and aligned on what exclusivity and fidelity mean to us.', isLikert: true },
      { id: 2, text: 'We have shared expectations about how much time we spend together vs. apart.', isLikert: true },
      { id: 3, text: 'We have talked about whether we want children and roughly when or if.', isLikert: true },
      { id: 4, text: 'I know what my partner expects from me when they are going through a hard time.', isLikert: true },
      { id: 5, text: 'We have discussed where we want to live long-term and if that\'s compatible.', isLikert: true },
      { id: 6, text: 'I know what my partner expects about gender roles and domestic responsibilities.', isLikert: true },
      { id: 7, text: 'We have talked about our expectations around physical intimacy frequency and style.', isLikert: true },
      { id: 8, text: 'I feel comfortable telling my partner when my expectations are not being met.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        clarity: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[3]||3)) / 3 * 20),
        expressibility: (answers[8]||3) * 20,
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Well-aligned expectations: You\'ve had the hard conversations most couples avoid. This kind of clarity is protective.');
      else insights.push('Expectation gaps: Many important assumptions haven\'t been explicitly named. This isn\'t failure — it\'s common. Schedule a "relationship audit" conversation to work through the items you scored low on.');
      if (scores.expressibility < 55) insights.push('If you don\'t feel safe expressing unmet expectations, the relationship is missing a safety condition. Naming this — calmly and at a good time — is the first step.');
      insights.push('The PREP research shows couples who discuss expectations before conflicts arise have significantly better long-term outcomes than those who "figure it out as they go."');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'jealousy',
    title: 'Jealousy & Security Scale',
    subtitle: 'How safe do you feel in your bond?',
    icon: Shield,
    color: 'from-orange-700 to-red-800',
    glow: 'border-orange-600/30',
    emoji: '🔐',
    desc: 'Some jealousy is a natural signal of caring. When it becomes chronic or controlling, it reflects anxiety and insecurity rather than love. This helps you understand your pattern.',
    duration: '3 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'I feel secure in my partner\'s commitment to me.', isLikert: true },
      { id: 2, text: 'I check my partner\'s phone, social media, or location more than I\'d like to admit.', isLikert: true },
      { id: 3, text: 'I feel anxious when my partner spends time with others without me.', isLikert: true },
      { id: 4, text: 'I trust my partner to be faithful even when I\'m not there.', isLikert: true },
      { id: 5, text: 'I have accused my partner of something without solid evidence.', isLikert: true },
      { id: 6, text: 'I feel confident my partner chooses me consistently.', isLikert: true },
    ],
    scorer: (answers) => ({
      security: Math.round(((answers[1]||3) + (answers[4]||3) + (answers[6]||3)) / 3 * 20),
      jealousy: Math.round(((answers[2]||3) + (answers[3]||3) + (answers[5]||3)) / 3 * 20),
      overall: Math.round(((answers[1]||3) + 6-(answers[2]||3) + 6-(answers[3]||3) + (answers[4]||3) + 6-(answers[5]||3) + (answers[6]||3)) / 6 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.security >= 70) insights.push('High security: You feel chosen and trusting — a stable relational baseline that lets both of you thrive independently and together.');
      if (scores.jealousy >= 60) insights.push('Elevated jealousy: This usually reflects anxiety about loss, not evidence of a partner\'s untrustworthiness. Addressing the underlying fear (often rooted in past experience) is more effective than monitoring behavior.');
      insights.push('Healthy jealousy is a signal ("I care"); problematic jealousy is a system of control. The difference lies in what you do with the feeling.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'forgiveness',
    title: 'Forgiveness Scale',
    subtitle: 'Your capacity to let go and move forward',
    icon: Heart,
    color: 'from-teal-700 to-cyan-800',
    glow: 'border-teal-600/30',
    emoji: '🕊️',
    desc: 'Research shows forgiveness (Enright & McCullough) is one of the most powerful predictors of relationship longevity and individual wellbeing. It\'s a skill — not a feeling.',
    duration: '4 min',
    category: 'Conflict',
    questions: [
      { id: 1, text: 'When my partner hurts me, I am able to eventually let go and move forward.', isLikert: true },
      { id: 2, text: 'I hold onto past grievances and bring them up during current conflicts.', isLikert: true },
      { id: 3, text: 'I believe forgiveness is possible without the behavior necessarily repeating.', isLikert: true },
      { id: 4, text: 'I have genuinely forgiven my partner for significant past hurts.', isLikert: true },
      { id: 5, text: 'I find it hard to trust my partner again after they\'ve hurt me.', isLikert: true },
      { id: 6, text: 'Forgiveness, for me, means letting go of resentment — not excusing the behavior.', isLikert: true },
      { id: 7, text: 'I can separate forgiving someone from deciding to stay in a situation.', isLikert: true },
      { id: 8, text: 'Ruminating on past hurts is something I struggle with.', isLikert: true },
    ],
    scorer: (answers) => ({
      forgiveness: Math.round(((answers[1]||3) + (answers[3]||3) + (answers[4]||3) + (answers[6]||3) + (answers[7]||3)) / 5 * 20),
      rumination: Math.round(((answers[2]||3) + (answers[5]||3) + (answers[8]||3)) / 3 * 20),
      overall: Math.round(((answers[1]||3) + 6-(answers[2]||3) + (answers[3]||3) + (answers[4]||3) + 6-(answers[5]||3) + (answers[6]||3) + (answers[7]||3) + 6-(answers[8]||3)) / 8 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.forgiveness >= 70) insights.push('Strong forgiveness capacity: You can move through hurt without permanently stockpiling it — one of the most valuable relationship and personal health skills.');
      else insights.push('Forgiveness work needed: Holding onto resentment costs the holder more than the offender. Forgiveness is releasing the past for your own freedom — not excusing anyone.');
      if (scores.rumination >= 60) insights.push('High rumination: Replaying past hurts keeps the nervous system in a threat state. Mindfulness practices (particularly labeling emotions) interrupt this cycle effectively.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'future_vision',
    title: 'Future Vision Alignment',
    subtitle: 'Are you building the same future?',
    icon: Star,
    color: 'from-cyan-700 to-blue-800',
    glow: 'border-cyan-600/30',
    emoji: '🔭',
    desc: 'Long-term compatibility depends on whether your visions of the future are compatible. This explores where your paths converge and diverge.',
    duration: '4 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We agree on whether we want to get married or formalize our commitment.', isLikert: true },
      { id: 2, text: 'We agree on whether we want children and how many.', isLikert: true },
      { id: 3, text: 'We have a compatible vision for where we want to live geographically.', isLikert: true },
      { id: 4, text: 'Our career and lifestyle ambitions are compatible with a shared life.', isLikert: true },
      { id: 5, text: 'We share a vision of what retirement or later life looks like.', isLikert: true },
      { id: 6, text: 'We talk about the future together with excitement, not anxiety.', isLikert: true },
      { id: 7, text: 'I can see my partner clearly in my life 10 years from now.', isLikert: true },
      { id: 8, text: 'We have a shared sense of what "success" as a couple looks like.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        structuralAlignment: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[3]||3)) / 3 * 20),
        emotionalOptimism: Math.round(((answers[6]||3) + (answers[7]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong future alignment: You\'re building toward a compatible future. Continue making your shared vision explicit — written, revisited, updated.');
      else if (scores.overall >= 50) insights.push('Partial future alignment: Some paths converge clearly; others are uncertain or misaligned. The unaligned areas need direct conversation, not avoidance.');
      else insights.push('Future misalignment: Significant divergence in life vision is one of the hardest relationship challenges — not because love is absent, but because logistics matter enormously over time.');
      if (scores.emotionalOptimism < 55) insights.push('If thinking about your future together brings anxiety rather than excitement, that\'s worth exploring. Is it situational or systemic?');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'appreciation',
    title: 'Appreciation vs. Resentment',
    subtitle: 'The ratio that predicts everything',
    icon: Heart,
    color: 'from-rose-600 to-pink-700',
    glow: 'border-rose-500/30',
    emoji: '🌹',
    desc: 'Gottman\'s research shows the "magic ratio" is 5:1 — five positive interactions for every negative one. This measures where you currently sit.',
    duration: '3 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'I regularly express genuine appreciation and gratitude to my partner.', isLikert: true },
      { id: 2, text: 'I notice and mention positive things my partner does more than negative ones.', isLikert: true },
      { id: 3, text: 'I feel genuinely appreciated by my partner.', isLikert: true },
      { id: 4, text: 'There is ongoing resentment between us from unresolved issues.', isLikert: true },
      { id: 5, text: 'I can still find things I genuinely admire in my partner even during conflict.', isLikert: true },
      { id: 6, text: 'I express admiration, not just satisfaction, to my partner regularly.', isLikert: true },
    ],
    scorer: (answers) => ({
      appreciation: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[5]||3) + (answers[6]||3)) / 4 * 20),
      resentment: (answers[4]||3) * 20,
      mutualFeel: (answers[3]||3) * 20,
      overall: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[3]||3) + 6-(answers[4]||3) + (answers[5]||3) + (answers[6]||3)) / 6 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.appreciation >= 70) insights.push('Strong appreciation culture: You\'re building positive deposits in your relational bank account. This makes withdrawals (conflict, hard days) survivable.');
      else insights.push('Build appreciation habits: Start a "3 things I appreciate about my partner" practice — not for them, for yourself. It reshapes what you notice.');
      if (scores.resentment >= 60) insights.push('Significant resentment: This is a serious signal. Resentment is a warning light — it means important needs haven\'t been addressed. Address the source, not the symptom.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'intimacy_needs',
    title: 'Intimacy Needs Profile',
    subtitle: 'What closeness actually means to you',
    icon: Flame,
    color: 'from-purple-700 to-violet-800',
    glow: 'border-purple-600/30',
    emoji: '💜',
    desc: 'Intimacy is multidimensional — emotional, intellectual, spiritual, recreational, and physical. Mismatched needs in one area can destabilize others.',
    duration: '4 min',
    category: 'Intimacy',
    questions: [
      { id: 1, text: 'I need my partner to be emotionally available and responsive — not just physically present.', isLikert: true },
      { id: 2, text: 'Intellectual connection — debating ideas, learning together — is important to my sense of intimacy.', isLikert: true },
      { id: 3, text: 'Sharing spiritual practices, beliefs, or a sense of meaning together feels important to me.', isLikert: true },
      { id: 4, text: 'Doing activities and hobbies together (not just being in the same space) matters to me.', isLikert: true },
      { id: 5, text: 'Physical intimacy — not just sex, but all forms of closeness — is a core need for me.', isLikert: true },
      { id: 6, text: 'Feeling seen and known by my partner satisfies me more than any other form of closeness.', isLikert: true },
      { id: 7, text: 'When my intimacy needs aren\'t met, other areas of the relationship suffer.', isLikert: true },
      { id: 8, text: 'I can clearly articulate to my partner what kind of closeness I need and when.', isLikert: true },
    ],
    scorer: (answers) => ({
      emotional: (answers[1]||3) * 20,
      intellectual: (answers[2]||3) * 20,
      spiritual: (answers[3]||3) * 20,
      recreational: (answers[4]||3) * 20,
      physical: (answers[5]||3) * 20,
      expressibility: (answers[8]||3) * 20,
    }),
    interpreter: (scores) => {
      const sorted = Object.entries(scores).filter(([k]) => k !== 'expressibility').sort(([,a],[,b]) => b - a);
      const top = sorted[0][0];
      const map: Record<string, string> = {
        emotional: 'Emotional intimacy is your primary need — being truly known, seen, and emotionally met is how you feel closest.',
        intellectual: 'Intellectual intimacy is central to you — you feel closest when minds connect, not just hearts.',
        spiritual: 'Spiritual intimacy matters deeply — shared meaning and a sense of transcendence together is how you bond at the deepest level.',
        recreational: 'Recreational intimacy is important to you — shared play, activities, and fun are not optional extras; they\'re how you connect.',
        physical: 'Physical intimacy is a core need — all forms of physical closeness communicate love and connection for you.',
      };
      const insights = [map[top] || 'Your intimacy needs are multidimensional.'];
      if (scores.expressibility < 55) insights.push('You struggle to articulate your intimacy needs — this gap between need and expression is where many relationships quietly fail. Start with one need, simply stated.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'financial_values',
    title: 'Financial Values Compatibility',
    subtitle: 'Money is never just about money',
    icon: Scale,
    color: 'from-green-700 to-emerald-800',
    glow: 'border-green-600/30',
    emoji: '💰',
    desc: 'Financial conflict is the leading predictor of divorce. Understanding your financial values — not just your budget habits — prevents most of these conflicts before they occur.',
    duration: '4 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We have similar beliefs about how much of our income to save vs. spend.', isLikert: true },
      { id: 2, text: 'We are aligned on how much financial risk is acceptable (investments, entrepreneurship, etc.).', isLikert: true },
      { id: 3, text: 'We have agreed on how to handle money as a couple — joint accounts, separate, or hybrid.', isLikert: true },
      { id: 4, text: 'We agree on how much to give generously to others or causes.', isLikert: true },
      { id: 5, text: 'Money decisions are made collaboratively, with neither person having disproportionate control.', isLikert: true },
      { id: 6, text: 'We are honest with each other about how we spend money, even on personal items.', isLikert: true },
      { id: 7, text: 'We have discussed our financial goals for the next 5-10 years and they are compatible.', isLikert: true },
      { id: 8, text: 'Financial stress, when it comes, brings us closer together rather than creating blame.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        transparency: Math.round(((answers[5]||3) + (answers[6]||3)) / 2 * 20),
        alignment: Math.round(((answers[1]||3) + (answers[2]||3) + (answers[7]||3)) / 3 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong financial compatibility: You\'ve built transparent, aligned financial values — one of the rarest and most protective relationship assets.');
      else if (scores.overall >= 50) insights.push('Partial financial alignment: Some values match, others don\'t. Monthly "money dates" — calm, non-crisis financial conversations — close these gaps over time.');
      else insights.push('Financial misalignment: This needs direct attention. Not because money is the most important thing, but because financial conflict is the primary trigger for contempt and resentment.');
      if (scores.transparency < 55) insights.push('Financial transparency (not just visibility, but honesty about spending impulses and emotional money patterns) is the foundation of financial trust.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'partnership_balance',
    title: 'Partnership Balance Scale',
    subtitle: 'Equity in your shared life',
    icon: Scale,
    color: 'from-violet-700 to-indigo-800',
    glow: 'border-violet-600/30',
    emoji: '⚖️',
    desc: 'Research on equity theory (Walster & Hatfield) shows perceived fairness is more predictive of long-term satisfaction than any other single factor. This measures how balanced your partnership feels.',
    duration: '4 min',
    category: 'Relationship',
    questions: [
      { id: 1, text: 'Domestic responsibilities (cleaning, cooking, errands) feel fairly distributed.', isLikert: true },
      { id: 2, text: 'Emotional labor — managing feelings, remembering obligations — is shared equitably.', isLikert: true },
      { id: 3, text: 'Both of our careers and personal goals get equal support and investment.', isLikert: true },
      { id: 4, text: 'One person doesn\'t consistently sacrifice more than the other.', isLikert: true },
      { id: 5, text: 'We both feel like we give and receive roughly equivalent amounts of care.', isLikert: true },
      { id: 6, text: 'Neither of us carries a disproportionate share of the mental load.', isLikert: true },
      { id: 7, text: 'When imbalances arise, we address them directly rather than resentfully absorbing them.', isLikert: true },
      { id: 8, text: 'I feel valued for what I contribute to this relationship.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        domesticBalance: Math.round(((answers[1]||3) + (answers[6]||3)) / 2 * 20),
        emotionalBalance: Math.round(((answers[2]||3) + (answers[5]||3)) / 2 * 20),
        repairAbility: (answers[7]||3) * 20,
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong partnership equity: Both of you feel the balance is roughly fair — a foundational condition for sustainable satisfaction.');
      else insights.push('Equity gap: Perceived unfairness — even when unintentional — creates chronic low-grade resentment. The conversation to have is not about blame, but about relief: what would make this feel fairer?');
      if (scores.domesticBalance < 50) insights.push('Domestic imbalance is one of the most common unspoken relationship injuries, especially for women. Making invisible labor visible (even listing it) is a prerequisite for sharing it.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'stress_coping',
    title: 'Stress & Coping Compatibility',
    subtitle: 'How you handle pressure together',
    icon: Zap,
    color: 'from-blue-600 to-indigo-700',
    glow: 'border-blue-500/30',
    emoji: '⚡',
    desc: 'How partners cope with stress — individually and together — is a key determinant of relationship quality during difficult periods.',
    duration: '3 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'When I\'m stressed, I prefer to talk it out with my partner rather than process alone.', isLikert: true },
      { id: 2, text: 'My partner\'s way of coping with stress is compatible with mine.', isLikert: true },
      { id: 3, text: 'When one of us is under stress, we still treat each other with care and patience.', isLikert: true },
      { id: 4, text: 'External stress (work, family, finances) tends to spill over into how we treat each other.', isLikert: true },
      { id: 5, text: 'We have routines or practices that help us decompress together.', isLikert: true },
      { id: 6, text: 'I feel supported by my partner when I am going through hard times.', isLikert: true },
    ],
    scorer: (answers) => ({
      compatibility: (answers[2]||3) * 20,
      resilience: Math.round(((answers[3]||3) + 6-(answers[4]||3)) / 2 * 20),
      support: Math.round(((answers[5]||3) + (answers[6]||3)) / 2 * 20),
      overall: Math.round(((answers[2]||3) + (answers[3]||3) + 6-(answers[4]||3) + (answers[5]||3) + (answers[6]||3)) / 5 * 20),
    }),
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong stress compatibility: You handle pressure in ways that are complementary rather than conflicting — and you have each other\'s backs through it.');
      else insights.push('Stress incompatibility: How you each cope under pressure isn\'t well matched right now. Naming your needs during stress (before the stress hits) dramatically improves this.');
      if (scores.resilience < 55) insights.push('External stress spilling into the relationship is normal — up to a point. The Gottman antidote is "stress-reducing conversations": 20 minutes where you each just listen and empathize, no problem-solving.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'intimacy_values',
    title: 'Intimacy Values Assessment',
    subtitle: 'Physical connection and its meaning',
    icon: Flame,
    color: 'from-red-700 to-rose-800',
    glow: 'border-red-600/30',
    emoji: '✨',
    desc: 'Physical intimacy — its meaning, frequency preferences, and emotional role — is a significant compatibility factor that most couples never explicitly discuss.',
    duration: '4 min',
    category: 'Intimacy',
    questions: [
      { id: 1, text: 'Physical intimacy is an important way I express and experience love in a relationship.', isLikert: true },
      { id: 2, text: 'I feel my current level of physical intimacy with my partner meets my needs.', isLikert: true },
      { id: 3, text: 'We can talk openly about our physical needs and preferences without awkwardness.', isLikert: true },
      { id: 4, text: 'Emotional closeness and physical intimacy are connected for me — one affects the other.', isLikert: true },
      { id: 5, text: 'I feel safe and comfortable in my physical relationship with my partner.', isLikert: true },
      { id: 6, text: 'I can tell my partner when I want more or less physical intimacy without fear.', isLikert: true },
      { id: 7, text: 'We make time and effort to maintain physical connection even when life is busy.', isLikert: true },
      { id: 8, text: 'Our physical relationship has evolved in ways that work for both of us over time.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        satisfaction: Math.round(((answers[2]||3) + (answers[5]||3)) / 2 * 20),
        communication: Math.round(((answers[3]||3) + (answers[6]||3)) / 2 * 20),
        intentionality: Math.round(((answers[7]||3) + (answers[8]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Healthy physical intimacy: Your physical relationship is a source of connection, communication is open, and both partners feel met.');
      else if (scores.overall >= 50) insights.push('Mixed physical intimacy: There are aspects that work and aspects that don\'t. The most important intervention is direct, compassionate conversation about unmet needs.');
      else insights.push('Physical intimacy challenges: This is one of the most sensitive areas to address and one of the most important. Even one honest, vulnerable conversation can begin to shift this significantly.');
      if (scores.communication < 55) insights.push('The biggest barrier in most couples\' physical relationship is not desire — it\'s communication. Being able to say what you need (and hear it back) is the foundation.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'rel_readiness',
    title: 'Relationship Readiness Scale',
    subtitle: 'How prepared are you for deep partnership?',
    icon: Trophy,
    color: 'from-amber-600 to-yellow-700',
    glow: 'border-amber-500/30',
    emoji: '🏆',
    desc: 'Relationship readiness is not about being perfect — it\'s about being developed enough in key areas to sustain real intimacy. This helps you see where you\'re ready and where you\'re still growing.',
    duration: '4 min',
    category: 'Personality',
    questions: [
      { id: 1, text: 'I have done meaningful work to understand my patterns from past relationships.', isLikert: true },
      { id: 2, text: 'I am emotionally regulated enough to not punish my partner for my difficult feelings.', isLikert: true },
      { id: 3, text: 'I know how to take accountability for my mistakes without excessive shame or defensiveness.', isLikert: true },
      { id: 4, text: 'I am in a stable enough life situation to invest genuinely in a partnership.', isLikert: true },
      { id: 5, text: 'I can receive love without immediately undermining or deflecting it.', isLikert: true },
      { id: 6, text: 'I know how to express what I need without expecting my partner to read my mind.', isLikert: true },
      { id: 7, text: 'I can stay in difficult conversations long enough to reach understanding.', isLikert: true },
      { id: 8, text: 'I choose partners from a place of wholeness, not from fear or need.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (8 * 5)) * 100);
      return {
        overall,
        selfAwareness: Math.round(((answers[1]||3) + (answers[2]||3)) / 2 * 20),
        accountability: Math.round(((answers[3]||3) + (answers[7]||3)) / 2 * 20),
        needsExpression: Math.round(((answers[5]||3) + (answers[6]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 75) insights.push('High relationship readiness: You\'ve done meaningful internal work. You\'re showing up as a partner who can sustain real intimacy.');
      else if (scores.overall >= 50) insights.push('Developing readiness: You\'re ready in important ways with clear growth edges. This self-awareness is itself a sign of readiness.');
      else insights.push('Early stage readiness: There are foundational areas still being developed. This isn\'t a disqualification — it\'s a map. The most loving thing is growing these while in relationship.');
      if (scores.needsExpression < 55) insights.push('Needing your partner to know what you need without telling them is one of the primary sources of relationship disappointment. Clarity is an act of love.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'parenting_alignment',
    title: 'Parenting Values Alignment',
    subtitle: 'If you have or want children',
    icon: Users,
    color: 'from-green-600 to-teal-700',
    glow: 'border-green-500/30',
    emoji: '👶',
    desc: 'Parenting philosophy differences are a major source of ongoing conflict in families. This helps surface alignment — or important conversations to have — before they become friction.',
    duration: '3 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We have similar views on discipline — what it means and how it should be applied.', isLikert: true },
      { id: 2, text: 'We agree on how involved and present we each want to be as parents.', isLikert: true },
      { id: 3, text: 'We have discussed how we\'ll handle the relationship with grandparents and extended family.', isLikert: true },
      { id: 4, text: 'We share similar views on education — public, private, religious, values taught.', isLikert: true },
      { id: 5, text: 'We agree on how to handle screen time, social media, and technology with children.', isLikert: true },
      { id: 6, text: 'We can disagree about parenting decisions without undermining each other in front of children.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (6 * 5)) * 100);
      return {
        overall,
        philosophyAlignment: Math.round(((answers[1]||3) + (answers[4]||3)) / 2 * 20),
        teamwork: Math.round(((answers[2]||3) + (answers[6]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong parenting alignment: You share foundational values about raising children. Ongoing dialogue as children develop will keep this strong.');
      else if (scores.overall >= 50) insights.push('Partial parenting alignment: Some philosophies match; others haven\'t been discussed or aligned. Preemptive conversations are far easier than reactive ones.');
      else insights.push('Parenting misalignment: Significant differences in parenting philosophy need direct, non-critical conversation. These conversations are investments in both your partnership and your children.');
      if (scores.teamwork < 55) insights.push('Presenting a united parenting front (resolving disagreements in private, not in front of children) is one of the highest-impact parenting and relationship practices.');
      return insights.slice(0, 3);
    },
  },
  {
    id: 'social_compatibility',
    title: 'Social Life Compatibility',
    subtitle: 'How you engage with the world together',
    icon: Users,
    color: 'from-indigo-600 to-purple-700',
    glow: 'border-indigo-500/30',
    emoji: '🌍',
    desc: 'Social preferences — how much time you spend with others, your friend groups, family involvement, and introversion/extroversion balance — shape daily life together profoundly.',
    duration: '3 min',
    category: 'Compatibility',
    questions: [
      { id: 1, text: 'We have a compatible balance of social time together vs. time alone.', isLikert: true },
      { id: 2, text: 'We enjoy spending time with each other\'s friend groups.', isLikert: true },
      { id: 3, text: 'Our families of origin are similarly involved in our lives.', isLikert: true },
      { id: 4, text: 'We agree on how much couple time vs. solo social time is healthy.', isLikert: true },
      { id: 5, text: 'Our introversion/extroversion tendencies are compatible enough not to create ongoing friction.', isLikert: true },
      { id: 6, text: 'We have mutual friends and build a social world together, not just parallel ones.', isLikert: true },
    ],
    scorer: (answers) => {
      const total = Object.values(answers).reduce((s, v) => s + v, 0);
      const overall = Math.round((total / (6 * 5)) * 100);
      return {
        overall,
        socialBalance: Math.round(((answers[1]||3) + (answers[4]||3) + (answers[5]||3)) / 3 * 20),
        socialIntegration: Math.round(((answers[2]||3) + (answers[6]||3)) / 2 * 20),
      };
    },
    interpreter: (scores) => {
      const insights: string[] = [];
      if (scores.overall >= 70) insights.push('Strong social compatibility: Your social lives mesh well — you navigate introversion/extroversion, family, and friend circles without significant friction.');
      else if (scores.overall >= 50) insights.push('Moderate social compatibility: Some social preferences align, others create tension. Naming your social needs explicitly (rather than hoping they\'re understood) helps enormously.');
      else insights.push('Social friction: Significant differences in social needs or social worlds. These often go unaddressed until resentment builds. Have an explicit "social contract" conversation.');
      return insights.slice(0, 3);
    },
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Relationship: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
  Personality: 'bg-violet-500/20 text-violet-300 border-violet-400/30',
  Conflict: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
  Intimacy: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
  Compatibility: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
};

export default function HarmonyQuizzes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeQuiz, setActiveQuiz] = useState<HarmonyQuizId | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [quizInsights, setQuizInsights] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('All');

  const { data: portraitData } = useQuery<any>({
    queryKey: ['/api/life-portrait'],
    retry: false,
  });

  const completedQuizzes: Record<string, any> = portraitData?.portrait?.quizResults || {};

  const saveMutation = useMutation({
    mutationFn: async ({ quizType, scores }: { quizType: string; scores: Record<string, number> }) => {
      return { insights: null };
    },
    onSuccess: (data) => {
      if (data.insights) setAiInsights(data.insights);
      queryClient.invalidateQueries({ queryKey: ['/api/life-portrait'] });
      toast({ title: '💜 Results saved to your Life Portrait!' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Save failed', description: 'Your results are here — tap the retry button or come back later.' });
    },
  });

  const quiz = activeQuiz ? HARMONY_QUIZZES.find(q => q.id === activeQuiz) : null;
  const totalAnswered = quiz ? Object.keys(answers).filter(k => quiz.questions.some(q => q.id === parseInt(k))).length : 0;
  const progressPct = quiz ? Math.round((totalAnswered / quiz.questions.length) * 100) : 0;

  const startQuiz = (id: HarmonyQuizId) => {
    setActiveQuiz(id);
    setCurrentQ(0);
    setAnswers({});
    setQuizDone(false);
    setQuizScores({});
    setQuizInsights([]);
    setAiInsights([]);
  };

  const answerAndAdvance = (val: number) => {
    const q = quiz!.questions[currentQ];
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    if (currentQ < quiz!.questions.length - 1) {
      setTimeout(() => setCurrentQ(prev => prev + 1), 140);
    }
  };

  const finishQuiz = (finalAnswers = answers) => {
    const scores = quiz!.scorer(finalAnswers);
    const insights = quiz!.interpreter(scores);
    setQuizScores(scores);
    setQuizInsights(insights);
    setQuizDone(true);
    saveMutation.mutate({ quizType: `harmony_${quiz!.id}`, scores });
  };

  if (quiz && !quizDone) {
    const q = quiz.questions[currentQ];
    const currentAnswer = answers[q.id];
    const isLast = currentQ === quiz.questions.length - 1;
    const allAnswered = quiz.questions.every(qq => answers[qq.id] !== undefined);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(244,63,94,0.10) 0%, #06030e 65%)' }}>
        <div className="max-w-lg mx-auto w-full px-5 py-7 flex flex-col min-h-screen">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <button onClick={() => setActiveQuiz(null)} className="flex items-center gap-1.5 text-white/35 hover:text-white/70 text-sm transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(244,63,94,0.2)' }}>
                {quiz.emoji}
              </div>
              <p className="text-white/50 text-xs font-semibold tracking-wider uppercase">{quiz.title}</p>
            </div>
            <span className="text-white/35 text-sm tabular-nums font-mono">{currentQ + 1}<span className="text-white/20">/{quiz.questions.length}</span></span>
          </div>

          {/* Segmented progress */}
          <div className="flex gap-0.5 mb-9">
            {quiz.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  answers[quiz.questions[i].id] !== undefined
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : i === currentQ ? 'bg-white/40' : 'bg-white/10 hover:bg-white/20'
                }`} />
            ))}
          </div>

          {/* Question area */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div key={currentQ}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}>

                {/* Watermark number */}
                <p className="text-white/[0.035] font-black text-[7rem] text-center leading-none select-none tabular-nums -mb-5">
                  {String(currentQ + 1).padStart(2, '0')}
                </p>

                {/* Question text */}
                <p className="text-white text-xl font-bold leading-snug text-center mb-10 px-2">{q.text}</p>

                {/* Likert options */}
                <div className="space-y-3">
                  {LIKERT_LABELS.map((label, i) => {
                    const isSelected = currentAnswer === i + 1;
                    const c = HARMONY_OPTION_COLORS[i];
                    return (
                      <motion.button key={i} onClick={() => answerAndAdvance(i + 1)}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-left relative overflow-hidden ${
                          isSelected
                            ? `bg-gradient-to-r ${c.bg} ${c.border} shadow-xl ${c.glow}`
                            : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.06]'
                        }`}>
                        {isSelected && <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" />}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all duration-200 ${
                          isSelected ? `${c.badge} shadow-lg` : 'bg-white/[0.07] text-white/25'
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`font-semibold text-sm flex-1 transition-colors ${isSelected ? 'text-white' : 'text-white/55'}`}>
                          {label}
                        </span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/[0.06]">
            <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}
              className="flex items-center gap-2 text-white/35 hover:text-white/70 disabled:opacity-20 text-sm font-medium transition-colors px-4 py-2 rounded-xl hover:bg-white/5">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            {isLast && allAnswered ? (
              <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                onClick={() => finishQuiz()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm hover:opacity-90 transition shadow-lg shadow-rose-900/40">
                Complete ✓
              </motion.button>
            ) : (
              <span className="text-white/20 text-xs tabular-nums">{totalAnswered}/{quiz.questions.length} answered</span>
            )}

            <button onClick={() => {
              if (isLast && allAnswered) { finishQuiz(); }
              else { setCurrentQ(p => Math.min(quiz!.questions.length - 1, p + 1)); }
            }} disabled={currentQ >= quiz.questions.length - 1 && !allAnswered}
              className="flex items-center gap-2 text-white/35 hover:text-white/70 disabled:opacity-20 text-sm font-medium transition-colors px-4 py-2 rounded-xl hover:bg-white/5">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quiz && quizDone) {
    const scoreEntries = Object.entries(quizScores).sort(([,a],[,b]) => b - a);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950/20 to-purple-950/10">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
          <button onClick={() => setActiveQuiz(null)} className="text-white/40 hover:text-white text-sm flex items-center gap-1.5 transition-colors mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> All Harmony Quizzes
          </button>

          {/* Hero result card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${quiz.color} shadow-2xl`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            <div className="absolute top-0 left-0 right-0 h-px bg-white/25" />
            <div className="relative p-6 text-center">
              <div className="text-5xl mb-3">{quiz.emoji}</div>
              <h2 className="text-white font-black text-2xl mb-1">{quiz.title} Complete</h2>
              <p className="text-white/70 text-sm mb-3">Results saved to your Life Portrait</p>
              {saveMutation.isPending && (
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-xs text-white/80">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-3 h-3" />
                  </motion.div>
                  Saving…
                </div>
              )}
              {saveMutation.isError && (
                <button onClick={() => saveMutation.mutate({ quizType: `harmony_${quiz.id}`, scores: quizScores })}
                  className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5 text-xs text-white/80 hover:bg-white/25 transition">
                  <RefreshCw className="w-3 h-3" /> Retry Save
                </button>
              )}
            </div>
          </motion.div>

          {/* Scores */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-900/80 border border-slate-700/40 backdrop-blur-sm">
              <CardContent className="p-5 space-y-4">
                <p className="text-white/30 text-xs font-bold tracking-widest uppercase">Your Scores</p>
                {scoreEntries.map(([key, val]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-white/80 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className={`text-xs font-black ${val >= 70 ? 'text-emerald-400' : val >= 45 ? 'text-amber-400' : 'text-rose-400'}`}>{Math.round(val)}</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div className={`h-full rounded-full ${val >= 70 ? 'bg-emerald-500' : val >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/80 border border-rose-700/25 backdrop-blur-sm">
              <CardContent className="p-5 space-y-3">
                <p className="text-rose-400/80 text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> What This Reveals
                </p>
                {(aiInsights.length > 0 ? aiInsights : quizInsights).map((insight, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex gap-3 items-start bg-rose-500/[0.06] border border-rose-500/15 rounded-xl p-3.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-white/70 text-sm leading-relaxed">{insight}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <Button onClick={() => setActiveQuiz(null)}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white font-bold shadow-lg shadow-rose-900/40 h-12">
            Take Another Quiz <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const categories = ['All', 'Relationship', 'Conflict', 'Intimacy', 'Compatibility', 'Personality'];
  const filtered = filter === 'All' ? HARMONY_QUIZZES : HARMONY_QUIZZES.filter(q => q.category === filter);
  const completedCount = HARMONY_QUIZZES.filter(q => completedQuizzes[`harmony_${q.id}`]).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950/20 to-purple-950/10">
      <div className="border-b border-rose-800/20 bg-gradient-to-r from-slate-950 via-rose-950/30 to-purple-950/20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/harmony-hub">
            <button className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Harmony
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Harmony Quizzes</h1>
              <p className="text-slate-400 text-sm">22 relationship, personality & conflict assessments. All results build your Life Portrait.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-rose-400" /> Relationship Insight Score
              </span>
              <span className="text-rose-400 text-sm font-bold">{Math.round((completedCount / HARMONY_QUIZZES.length) * 100)}%</span>
            </div>
            <Progress value={Math.round((completedCount / HARMONY_QUIZZES.length) * 100)} className="h-2 bg-slate-800" />
            <p className="text-slate-600 text-xs mt-1.5">{completedCount} of {HARMONY_QUIZZES.length} quizzes completed</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === cat
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:border-rose-500/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(q => {
            const Icon = q.icon;
            const done = !!completedQuizzes[`harmony_${q.id}`];
            const completedAt = completedQuizzes[`harmony_${q.id}`]?.completedAt;
            return (
              <Card key={q.id} className={`bg-slate-900/60 border ${q.glow} overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center shrink-0 text-xl`}>
                      {q.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="text-white font-semibold text-base">{q.title}</h3>
                          <p className="text-slate-500 text-xs">{q.subtitle}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <Badge className={`border text-xs ${CATEGORY_COLORS[q.category]}`}>{q.category}</Badge>
                          {done && <Badge className="bg-emerald-600/25 text-emerald-300 border-emerald-500/30 border text-xs">✓ Done</Badge>}
                          <span className="text-slate-600 text-xs">{q.duration}</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{q.desc}</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startQuiz(q.id)}
                          size="sm"
                          className={`${done ? 'bg-slate-700 hover:bg-slate-600' : `bg-gradient-to-r ${q.color} hover:opacity-90`} text-white text-xs`}
                        >
                          {done ? <><RefreshCw className="w-3 h-3 mr-1.5" /> Retake</> : <>Start Quiz <ArrowRight className="w-3 h-3 ml-1.5" /></>}
                        </Button>
                        {completedAt && (
                          <span className="text-slate-600 text-xs self-center">
                            Last: {new Date(completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-slate-600 text-xs pb-6 pt-4">
          Every quiz adds to your Life Portrait and helps Harmony give you more personalized relationship guidance.
        </p>
      </div>
    </div>
  );
}
