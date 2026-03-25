import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Heart, AlertTriangle, Lightbulb, MessageCircle, ClipboardList, Home } from "lucide-react";

export default function CouplesInsights() {
  const [, setLocation] = useLocation();
  const [therapyId, setTherapyId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('therapyId');
    if (tid) setTherapyId(tid);
  }, []);

  // Mock insights data - replace with actual AI-generated insights
  const insights = {
    compatibilityScore: 78,
    potentialConflicts: [
      {
        area: "Communication Style",
        partnerA: "Direct and straightforward",
        partnerB: "Indirect and diplomatic",
        why: "Partner A values honesty and clarity, while Partner B prioritizes harmony and feelings. This can lead to misunderstandings where A feels B is being evasive, and B feels A is too harsh.",
        howToFix: "Practice the 'soft startup' method: Partner A can preface difficult conversations with reassurance, while Partner B can practice being more direct while still being kind."
      },
      {
        area: "Conflict Resolution",
        partnerA: "Needs time to process alone",
        partnerB: "Wants to talk it out immediately",
        why: "Partner A is an introvert who needs space to think through emotions, while Partner B is an extravert who processes feelings by talking. This creates tension when conflicts arise.",
        howToFix: "Agree on a '30-minute rule': Take 30 minutes apart, then come together to discuss. Partner B gets the resolution, Partner A gets processing time."
      },
      {
        area: "Love Languages",
        partnerA: "Quality Time",
        partnerB: "Acts of Service",
        why: "Partner A feels loved through undivided attention and shared experiences, while Partner B feels loved through helpful actions. Both may feel unloved because they're giving what THEY need, not what their partner needs.",
        howToFix: "Create a 'love language schedule': Partner A schedules regular quality time dates, Partner B consciously does small helpful tasks. Both learn to receive love in different forms."
      }
    ],
    strengths: [
      "Both value family and long-term commitment",
      "Shared sense of humor and playfulness",
      "Complementary strengths (A is organized, B is creative)",
      "Strong physical attraction and affection"
    ],
    personalityInsights: {
      partnerA: {
        type: "Analytical Achiever",
        traits: "High conscientiousness, moderate openness, low neuroticism",
        whyTheyAre: "Likely raised in a structured environment where achievement was valued. May have had to 'earn' approval through accomplishments.",
        workingWithThem: "Give clear expectations, appreciate their organization, don't take their directness personally - it's how they show care."
      },
      partnerB: {
        type: "Empathetic Harmonizer",
        traits: "High agreeableness, high openness, moderate neuroticism",
        whyTheyAre: "Likely grew up as a peacekeeper, possibly in a household with conflict. Learned early that keeping everyone happy = safety.",
        workingWithThem: "Encourage honest expression, validate their feelings before problem-solving, appreciate their emotional intelligence."
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Couples Menu */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setLocation(`/couples-assessment?therapyId=${therapyId}`)}
            data-testid="button-assessment"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Assessment
          </Button>
          <Button
            variant="default"
            onClick={() => setLocation(`/couples-insights?therapyId=${therapyId}`)}
            data-testid="button-insights"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation(`/couples-therapy?therapyId=${therapyId}`)}
            data-testid="button-therapy"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Coaching Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation(`/couples-photos?therapyId=${therapyId}`)}
            data-testid="button-photos"
          >
            <Heart className="w-4 h-4 mr-2" />
            Photos
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            data-testid="button-home"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">
            Your Relationship Insights 💡
          </h1>
          <p className="text-xl text-white/50">
            Deep AI analysis of your compatibility, conflicts, and how to grow together
          </p>
        </div>

        {/* Compatibility Score */}
        <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Heart className="text-pink-600" />
              Compatibility Score: {insights.compatibilityScore}%
            </CardTitle>
            <CardDescription className="text-lg">
              You have strong potential together, with some growth areas
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Potential Conflicts */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="text-yellow-600" />
            What Might Clash (And Why)
          </h2>
          {insights.potentialConflicts.map((conflict, idx) => (
            <Card key={idx} className="border-2 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-2xl">{conflict.area}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-purple-600 mb-1">Partner A:</p>
                    <p className="text-gray-700 dark:text-gray-300">{conflict.partnerA}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-pink-600 mb-1">Partner B:</p>
                    <p className="text-gray-700 dark:text-gray-300">{conflict.partnerB}</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-1">Why This Happens:</p>
                  <p className="text-gray-600 dark:text-gray-400">{conflict.why}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    How To Fix It:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{conflict.howToFix}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Personality Insights */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-blue-600" />
            Why Each Person Is The Way They Are
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-600">
                  Partner A: {insights.personalityInsights.partnerA.type}
                </CardTitle>
                <CardDescription>{insights.personalityInsights.partnerA.traits}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">Why They're Like This:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {insights.personalityInsights.partnerA.whyTheyAre}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                    Working With Them:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {insights.personalityInsights.partnerA.workingWithThem}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-200 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="text-2xl text-pink-600">
                  Partner B: {insights.personalityInsights.partnerB.type}
                </CardTitle>
                <CardDescription>{insights.personalityInsights.partnerB.traits}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold mb-1">Why They're Like This:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {insights.personalityInsights.partnerB.whyTheyAre}
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                  <p className="font-semibold text-pink-700 dark:text-pink-400 mb-1">
                    Working With Them:
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {insights.personalityInsights.partnerB.workingWithThem}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strengths */}
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Your Strengths Together 💪</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Navigation to Therapy */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => setLocation(`/couples-therapy?therapyId=${therapyId}`)}
            className="text-lg px-8 py-6"
            data-testid="button-start-therapy"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start AI Coaching Session
          </Button>
        </div>
      </div>
    </div>
  );
}
