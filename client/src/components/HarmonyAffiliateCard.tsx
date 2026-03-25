import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Car, ShoppingCart, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AffiliateLink {
  label: string;
  description: string;
  icon: any;
  partner: string;
  url: string;
  context: string;
}

const AFFILIATE_LINKS: AffiliateLink[] = [
  {
    label: "Plan a date night 🗓️",
    description: "Navigate to date planner",
    icon: Calendar,
    partner: "groupon",
    url: "/date-planner",
    context: "date_planner_book",
  },
  {
    label: "Send something sweet 🍓",
    description: "Edible Arrangements",
    icon: Gift,
    partner: "edible_arrangements",
    url: "https://www.ediblearrangements.com/?utm_source=syncwithinsight",
    context: "harmony_gift",
  },
  {
    label: "Book a ride together 🚗",
    description: "Lyft",
    icon: Car,
    partner: "lyft",
    url: "https://www.lyft.com/rider?utm_source=syncwithinsight",
    context: "harmony_ride",
  },
  {
    label: "Cook together tonight 🛒",
    description: "Instacart",
    icon: ShoppingCart,
    partner: "instacart",
    url: "https://www.instacart.com/?utm_source=syncwithinsight",
    context: "harmony_cook",
  },
];

export function HarmonyAffiliateCard({ className }: { className?: string }) {
  const [, setLocation] = useLocation();

  const handleTrackClick = async (link: AffiliateLink) => {
    try {
      await apiRequest("POST", "/api/affiliate/track-click", {
        partner: link.partner,
        context: link.context,
      });
      
      if (link.url.startsWith("/")) {
        setLocation(link.url);
      } else {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to track affiliate click:", error);
      if (link.url.startsWith("/")) {
        setLocation(link.url);
      } else {
        window.open(link.url, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-blue-500/20 via-teal-500/15 to-cyan-500/20 border-teal-500/30 shadow-lg group ${className || ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-teal-100 flex items-center gap-2">
          Plan something together 💑
        </CardTitle>
        <CardDescription className="text-teal-200/70">
          Strengthen your bond with shared experiences and thoughtful gestures.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AFFILIATE_LINKS.map((link) => (
            <Button
              key={link.partner}
              variant="outline"
              className="bg-teal-900/40 border-teal-500/30 hover:bg-teal-800/60 text-teal-100 h-auto py-4 px-4 flex items-center justify-between text-left transition-all group/btn"
              onClick={() => handleTrackClick(link)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                  <link.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{link.label}</div>
                  <div className="text-xs text-teal-300/60 mt-0.5 line-clamp-1">
                    {link.description}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
            </Button>
          ))}
        </div>
      </CardContent>
      <div className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white text-center text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
        New Partner Deals Available
      </div>
    </Card>
  );
}
