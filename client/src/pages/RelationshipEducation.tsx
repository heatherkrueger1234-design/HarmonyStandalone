import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, Lightbulb, Heart, AlertTriangle, Scale, Brain, Users } from "lucide-react";

interface Topic {
  id: string;
  icon: any;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  sections: { heading: string; body: string }[];
  takeaway: string;
}

const TOPICS: Topic[] = [
  {
    id: "mental-load",
    icon: Brain,
    title: "Mental Load",
    badge: "Important",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    summary: "The invisible cognitive work of managing a household — tracking, planning, and remembering everything.",
    sections: [
      {
        heading: "What is mental load?",
        body: "Mental load is the constant background process of managing household and family life: remembering appointments, tracking supplies, planning meals, coordinating schedules. It's invisible because no single task is huge — but the cumulative weight of never being able to 'turn it off' is exhausting.",
      },
      {
        heading: "Why does it matter?",
        body: "When one partner carries the mental load disproportionately, they're doing two full-time jobs: their external work AND the cognitive management of the home. This creates chronic stress, resentment, and burnout — even when the other partner is doing their fair share of physical tasks.",
      },
      {
        heading: "Signs it's unbalanced",
        body: "One partner is always the one to notice things (low on groceries, child needs a doctor's appointment), initiates all planning, and feels like a 'project manager' of the relationship. The other partner 'helps when asked' — which still puts the burden of noticing and delegating on the first partner.",
      },
      {
        heading: "How to rebalance",
        body: "True sharing means owning entire domains — not just tasks. Assign one person to be fully responsible for certain areas (e.g., medical appointments, school logistics) without needing reminders. Then trust them to manage it. Hold regular household check-ins so both partners stay informed.",
      },
    ],
    takeaway: "Ask your partner: which areas feel heaviest for you right now? Then take full ownership of one.",
  },
  {
    id: "weaponized-incompetence",
    icon: AlertTriangle,
    title: "Weaponized Incompetence",
    badge: "Red Flag",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/30",
    summary: "Pretending or performing inability to avoid responsibilities — even when perfectly capable of learning.",
    sections: [
      {
        heading: "What is it?",
        body: "Weaponized incompetence (also called 'strategic incompetence') is when someone performs tasks so badly — or claims they 'just can't do it' — that their partner takes over and stops asking. The result: the incapable partner avoids the responsibility permanently.",
      },
      {
        heading: "Common examples",
        body: "Shrinking laundry on purpose so they're never asked again. Cooking something inedible 'by accident.' Handling childcare tasks so poorly that the other parent steps in every time. Saying 'I just don't know how' about things that could easily be learned with minimal effort.",
      },
      {
        heading: "How to spot it vs genuine struggle",
        body: "Genuine struggle involves attempting, learning, and improving over time. Weaponized incompetence involves consistent failure at the same tasks, often paired with an unwillingness to learn. If someone can complete complex tasks at work but claims helplessness at home, that's a red flag.",
      },
      {
        heading: "How to address it",
        body: "Name it clearly and non-accusatorially: 'I notice I always end up doing this because of what happened last time. I'd like you to own this going forward and figure it out.' Hold the outcome — not the method. If they do it differently, that's okay as long as it gets done.",
      },
    ],
    takeaway: "If this resonates, have an honest conversation. Incompetence that never improves is a choice.",
  },
  {
    id: "division-of-labor",
    icon: Scale,
    title: "Fair Division of Labor",
    badge: "Essential",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    summary: "How to divide household and relationship work in a way that feels genuinely fair to both people.",
    sections: [
      {
        heading: "Equal vs equitable",
        body: "Equal division means splitting 50/50. Equitable means splitting based on capacity, hours, energy, and circumstances. When one partner works longer hours, travels more, or has more demanding work, strict equality may actually feel unfair. The goal is that both partners feel the arrangement is fair.",
      },
      {
        heading: "Invisible vs visible work",
        body: "Visible work is mowing the lawn, washing dishes, driving kids. Invisible work is scheduling, planning, emotional labor, anticipating needs. Couples often track visible work and overlook invisible — leading to one person feeling overwhelmed despite having 'help' with tasks.",
      },
      {
        heading: "The resentment meter",
        body: "The fairness of your division isn't measured by a spreadsheet — it's measured by resentment. If either partner feels consistently drained, underappreciated, or like they're doing more than their share, the division needs to be revisited regardless of what the task list says.",
      },
      {
        heading: "Creating a fair system",
        body: "Sit together and list every recurring task in your household. Rate each task by effort and frequency. Honestly discuss who currently does each and how they feel about it. Then reassign based on preference (do what you hate less), capacity, and fairness — and revisit every few months.",
      },
    ],
    takeaway: "Do the division of labor audit together. List every task, then ask: is this actually fair?",
  },
  {
    id: "love-languages",
    icon: Heart,
    title: "The 5 Love Languages",
    badge: "Foundational",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    summary: "Understanding how you and your partner give and receive love — and why they don't always match.",
    sections: [
      {
        heading: "Why love languages matter",
        body: "Most relationship conflict isn't lack of love — it's a mismatch in how love is expressed. If you show love through acts of service but your partner needs words of affirmation, you can be working extremely hard to love them while they feel unloved. And vice versa.",
      },
      {
        heading: "The 5 languages",
        body: "Words of Affirmation: verbal expressions of love, appreciation, and encouragement. Acts of Service: doing things to lighten their load. Receiving Gifts: thoughtful tokens of affection. Quality Time: focused, present time together. Physical Touch: physical closeness and contact.",
      },
      {
        heading: "Identifying your languages",
        body: "Your love language is often the way you naturally express love to others — because it's what feels meaningful to you. It's also revealed by what hurts most when missing: feeling criticized (words), neglected (time), unsupported (acts), forgotten (gifts), or distant (touch).",
      },
      {
        heading: "Speaking their language",
        body: "This requires effort — deliberately expressing love in a way that doesn't come naturally. If your partner's language is quality time but yours is acts of service, you'll need to consciously put the phone down and be present, even when you'd rather show love by doing something helpful.",
      },
    ],
    takeaway: "Ask your partner: 'What makes you feel most loved?' Their answer is more important than any quiz.",
  },
  {
    id: "attachment",
    icon: Users,
    title: "Attachment Styles",
    badge: "Deep Dive",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    summary: "How your early experiences shaped how you connect, trust, and respond to closeness in relationships.",
    sections: [
      {
        heading: "The four styles",
        body: "Secure: comfortable with closeness and independent. Anxious (Preoccupied): craves closeness, fears abandonment, can seem 'needy.' Avoidant (Dismissive): values independence strongly, finds closeness uncomfortable, pulls away when things get intense. Fearful-Avoidant (Disorganized): wants closeness but fears it — tends toward push-pull patterns.",
      },
      {
        heading: "How they interact",
        body: "The most challenging pairing is anxious + avoidant. The anxious partner's bids for reassurance trigger the avoidant partner's need for space. The avoidant's pull-back triggers the anxious partner's fear of abandonment. Each person's reaction confirms the other's worst fear — creating a painful cycle.",
      },
      {
        heading: "This is not a fixed destiny",
        body: "Attachment styles are patterns formed in early life — but they're not permanent. Secure relationships, therapy, self-awareness, and intentional practice can shift insecure attachment toward security over time. Knowing your style is the first step to changing how it affects your relationship.",
      },
      {
        heading: "What helps",
        body: "For anxious partners: learning to self-soothe rather than seeking constant reassurance. For avoidant partners: practicing staying present during emotionally charged moments rather than shutting down. For both: developing a shared language to recognize when the cycle is starting.",
      },
    ],
    takeaway: "Understanding your attachment style isn't about having an excuse — it's about having a map.",
  },
];

export default function RelationshipEducation() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleTopic = (id: string) => setExpandedId(expandedId === id ? null : id);
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 pb-10">
      <div className="relative max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" onClick={() => navigate("/harmony-hub")} className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-300" /> Relationship Education
            </h1>
            <p className="text-xs text-white/50">Evidence-based guides to the concepts that shape every relationship</p>
          </div>
        </div>

        {/* Intro */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="bg-gradient-to-br from-indigo-600/12 to-violet-600/8 border border-indigo-500/20 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-indigo-300 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/60 leading-relaxed">
                  The couples who understand these concepts tend to fight less, connect more, and recover from conflict faster. Read these together or separately — then talk about what resonates.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topics */}
        <div className="space-y-3">
          {TOPICS.map((topic, idx) => {
            const Icon = topic.icon;
            const isExpanded = expandedId === topic.id;
            return (
              <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                <Card className={`border rounded-2xl overflow-hidden transition-all cursor-pointer ${isExpanded ? "bg-slate-800/50 border-white/[0.1]" : "bg-slate-800/25 border-white/[0.05] hover:bg-slate-800/40"}`}>
                  {/* Topic Header */}
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-5" onClick={() => toggleTopic(topic.id)}>
                      <div className="p-2.5 bg-white/[0.06] rounded-xl flex-shrink-0">
                        <Icon className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{topic.title}</h3>
                          <Badge className={`${topic.badgeColor} border text-[10px] px-1.5`}>{topic.badge}</Badge>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{topic.summary}</p>
                      </div>
                      <div className={`flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                        <ChevronRight className="w-4 h-4 text-white/30" />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                          className="border-t border-white/[0.06] overflow-hidden">
                          <div className="p-5 space-y-3">
                            {topic.sections.map((section, sIdx) => {
                              const key = `${topic.id}-${sIdx}`;
                              const isOpen = expandedSections[key];
                              return (
                                <div key={key} className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
                                  <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                                    <span className="text-xs font-semibold text-white/70">{section.heading}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                  </button>
                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                        <p className="text-xs text-white/55 leading-relaxed px-4 pb-3">{section.body}</p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}

                            {/* Takeaway */}
                            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-200/80 leading-relaxed italic">{topic.takeaway}</p>
                            </div>
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

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/harmony-pro")} className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold rounded-full px-6">
            Talk to AI Coach About These Topics
          </Button>
        </div>
      </div>
    </div>
  );
}
