import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Home, Trash2, Shirt, TreePine, Car, ShoppingCart,
  Plus, CheckCircle, Users, User, Minus, RefreshCw, BarChart3,
  ChevronDown, ChevronUp, Hammer, Wind, Droplets, FlameKindling,
  UtensilsCrossed, Bed, Star, Sparkles, X
} from "lucide-react";
import type { ChoreAssignment, CustomChore } from "@shared/schema";

// ── Chore master list ────────────────────────────────────────────────────────
type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'asneeded';
type AssignedTo = 'you' | 'partner' | 'shared' | 'skip';

interface Chore {
  id: string;
  name: string;
  category: string;
  icon: string;
  defaultFreq: Frequency;
}

const CATEGORIES: Array<{ id: string; label: string; icon: React.ElementType; color: string; border: string; text: string }> = [
  { id: "kitchen",    label: "Kitchen",          icon: UtensilsCrossed, color: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-300"   },
  { id: "bathrooms",  label: "Bathrooms",         icon: Droplets,        color: "bg-cyan-500/10",    border: "border-cyan-500/25",    text: "text-cyan-300"    },
  { id: "bedrooms",   label: "Bedrooms",          icon: Bed,             color: "bg-indigo-500/10",  border: "border-indigo-500/25",  text: "text-indigo-300"  },
  { id: "living",     label: "Living Areas",      icon: Home,            color: "bg-teal-500/10",    border: "border-teal-500/25",    text: "text-teal-300"    },
  { id: "laundry",    label: "Laundry",           icon: Shirt,           color: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-300"    },
  { id: "trash",      label: "Trash & Recycling", icon: Trash2,          color: "bg-red-500/10",     border: "border-red-500/25",     text: "text-red-300"     },
  { id: "outdoor",    label: "Outdoor & Yard",    icon: TreePine,        color: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300" },
  { id: "garage",     label: "Garage & Cars",     icon: Car,             color: "bg-slate-500/10",   border: "border-slate-500/25",   text: "text-slate-300"   },
  { id: "shopping",   label: "Shopping & Errands",icon: ShoppingCart,    color: "bg-purple-500/10",  border: "border-purple-500/25",  text: "text-purple-300"  },
  { id: "repairs",    label: "Repairs & Maintenance", icon: Hammer,      color: "bg-orange-500/10",  border: "border-orange-500/25",  text: "text-orange-300"  },
];

const CHORES: Chore[] = [
  // Kitchen
  { id: "k1",  name: "Wash dishes / load dishwasher", category: "kitchen",   icon: "🍽️",  defaultFreq: "daily"    },
  { id: "k2",  name: "Wipe countertops",               category: "kitchen",   icon: "🧽",  defaultFreq: "daily"    },
  { id: "k3",  name: "Clean stovetop & oven",          category: "kitchen",   icon: "🔥",  defaultFreq: "weekly"   },
  { id: "k4",  name: "Clean microwave",                category: "kitchen",   icon: "📦",  defaultFreq: "weekly"   },
  { id: "k5",  name: "Wipe down refrigerator",         category: "kitchen",   icon: "🧊",  defaultFreq: "monthly"  },
  { id: "k6",  name: "Sweep / mop kitchen floor",      category: "kitchen",   icon: "🧹",  defaultFreq: "weekly"   },
  { id: "k7",  name: "Empty & clean trash can",        category: "kitchen",   icon: "🗑️",  defaultFreq: "weekly"   },
  { id: "k8",  name: "Wipe cabinet fronts",            category: "kitchen",   icon: "🪟",  defaultFreq: "monthly"  },
  { id: "k9",  name: "Clean sink & faucet",            category: "kitchen",   icon: "🚿",  defaultFreq: "weekly"   },
  { id: "k10", name: "Organize pantry & fridge",       category: "kitchen",   icon: "📋",  defaultFreq: "monthly"  },
  // Bathrooms
  { id: "b1",  name: "Scrub toilet",                   category: "bathrooms", icon: "🚽",  defaultFreq: "weekly"   },
  { id: "b2",  name: "Wipe sink & mirror",             category: "bathrooms", icon: "🪞",  defaultFreq: "weekly"   },
  { id: "b3",  name: "Scrub shower / bathtub",         category: "bathrooms", icon: "🛁",  defaultFreq: "weekly"   },
  { id: "b4",  name: "Mop bathroom floor",             category: "bathrooms", icon: "🧽",  defaultFreq: "weekly"   },
  { id: "b5",  name: "Replace towels",                 category: "bathrooms", icon: "🛁",  defaultFreq: "weekly"   },
  { id: "b6",  name: "Restock soap & toilet paper",    category: "bathrooms", icon: "🧴",  defaultFreq: "asneeded" },
  { id: "b7",  name: "Clean grout & tiles",            category: "bathrooms", icon: "🪣",  defaultFreq: "monthly"  },
  // Bedrooms
  { id: "bd1", name: "Make the bed",                   category: "bedrooms",  icon: "🛏️",  defaultFreq: "daily"    },
  { id: "bd2", name: "Vacuum / sweep bedroom floors",  category: "bedrooms",  icon: "🧹",  defaultFreq: "weekly"   },
  { id: "bd3", name: "Dust surfaces & furniture",      category: "bedrooms",  icon: "✨",  defaultFreq: "weekly"   },
  { id: "bd4", name: "Change bed sheets & pillowcases",category: "bedrooms",  icon: "🛏️",  defaultFreq: "biweekly" },
  { id: "bd5", name: "Organize closet",                category: "bedrooms",  icon: "👗",  defaultFreq: "monthly"  },
  // Living Areas
  { id: "l1",  name: "Vacuum / sweep living room",     category: "living",    icon: "🧹",  defaultFreq: "weekly"   },
  { id: "l2",  name: "Dust furniture & shelves",       category: "living",    icon: "🪣",  defaultFreq: "weekly"   },
  { id: "l3",  name: "Tidy & declutter",               category: "living",    icon: "📦",  defaultFreq: "daily"    },
  { id: "l4",  name: "Clean windows & glass doors",    category: "living",    icon: "🪟",  defaultFreq: "monthly"  },
  { id: "l5",  name: "Wipe baseboards",                category: "living",    icon: "🧽",  defaultFreq: "monthly"  },
  { id: "l6",  name: "Clean ceiling fans & light fixtures", category: "living", icon: "💡", defaultFreq: "monthly" },
  { id: "l7",  name: "Vacuum sofa & cushions",         category: "living",    icon: "🛋️",  defaultFreq: "monthly"  },
  // Laundry
  { id: "la1", name: "Wash laundry",                   category: "laundry",   icon: "🫧",  defaultFreq: "weekly"   },
  { id: "la2", name: "Dry / hang laundry",             category: "laundry",   icon: "🌬️",  defaultFreq: "weekly"   },
  { id: "la3", name: "Fold & put away clothes",        category: "laundry",   icon: "👕",  defaultFreq: "weekly"   },
  { id: "la4", name: "Iron / steam clothes",           category: "laundry",   icon: "♨️",  defaultFreq: "asneeded" },
  { id: "la5", name: "Clean washing machine & dryer",  category: "laundry",   icon: "🧺",  defaultFreq: "monthly"  },
  // Trash
  { id: "t1",  name: "Take out indoor trash",          category: "trash",     icon: "🗑️",  defaultFreq: "weekly"   },
  { id: "t2",  name: "Roll out bins for collection",   category: "trash",     icon: "♻️",  defaultFreq: "weekly"   },
  { id: "t3",  name: "Collect & sort recycling",       category: "trash",     icon: "♻️",  defaultFreq: "weekly"   },
  { id: "t4",  name: "Clean & rinse bins",             category: "trash",     icon: "🪣",  defaultFreq: "monthly"  },
  // Outdoor
  { id: "o1",  name: "Mow the lawn",                   category: "outdoor",   icon: "🌿",  defaultFreq: "weekly"   },
  { id: "o2",  name: "Edge & trim lawn borders",       category: "outdoor",   icon: "✂️",  defaultFreq: "weekly"   },
  { id: "o3",  name: "Weed garden beds",               category: "outdoor",   icon: "🌱",  defaultFreq: "weekly"   },
  { id: "o4",  name: "Water plants & garden",          category: "outdoor",   icon: "💧",  defaultFreq: "daily"    },
  { id: "o5",  name: "Rake leaves",                    category: "outdoor",   icon: "🍂",  defaultFreq: "asneeded" },
  { id: "o6",  name: "Shovel snow & de-ice paths",     category: "outdoor",   icon: "❄️",  defaultFreq: "asneeded" },
  { id: "o7",  name: "Trim hedges & bushes",           category: "outdoor",   icon: "🌳",  defaultFreq: "monthly"  },
  { id: "o8",  name: "Sweep driveway & patio",         category: "outdoor",   icon: "🧹",  defaultFreq: "weekly"   },
  { id: "o9",  name: "Clean gutters",                  category: "outdoor",   icon: "🏠",  defaultFreq: "monthly"  },
  { id: "o10", name: "Fertilize / treat lawn",         category: "outdoor",   icon: "🌾",  defaultFreq: "monthly"  },
  { id: "o11", name: "Pool / hot tub maintenance",     category: "outdoor",   icon: "🏊",  defaultFreq: "weekly"   },
  { id: "o12", name: "Pressure wash surfaces",         category: "outdoor",   icon: "💦",  defaultFreq: "monthly"  },
  // Garage & Cars
  { id: "g1",  name: "Sweep / mop garage floor",       category: "garage",    icon: "🏠",  defaultFreq: "monthly"  },
  { id: "g2",  name: "Organize garage & storage",      category: "garage",    icon: "📦",  defaultFreq: "monthly"  },
  { id: "g3",  name: "Wash cars",                      category: "garage",    icon: "🚗",  defaultFreq: "monthly"  },
  { id: "g4",  name: "Vacuum car interiors",           category: "garage",    icon: "🚙",  defaultFreq: "monthly"  },
  { id: "g5",  name: "Check & top up fluids (car)",    category: "garage",    icon: "⛽",  defaultFreq: "monthly"  },
  { id: "g6",  name: "Schedule car service / MOT",     category: "garage",    icon: "🔧",  defaultFreq: "asneeded" },
  // Shopping & Errands
  { id: "s1",  name: "Weekly grocery shopping",        category: "shopping",  icon: "🛒",  defaultFreq: "weekly"   },
  { id: "s2",  name: "Meal planning",                  category: "shopping",  icon: "📋",  defaultFreq: "weekly"   },
  { id: "s3",  name: "Manage household budget / bills",category: "shopping",  icon: "💳",  defaultFreq: "monthly"  },
  { id: "s4",  name: "Run general errands",            category: "shopping",  icon: "🏃",  defaultFreq: "asneeded" },
  { id: "s5",  name: "Order household supplies online",category: "shopping",  icon: "📦",  defaultFreq: "asneeded" },
  { id: "s6",  name: "Book / manage appointments",     category: "shopping",  icon: "📅",  defaultFreq: "asneeded" },
  // Repairs & Maintenance
  { id: "r1",  name: "Replace light bulbs",            category: "repairs",   icon: "💡",  defaultFreq: "asneeded" },
  { id: "r2",  name: "Fix minor leaks / drips",        category: "repairs",   icon: "🔧",  defaultFreq: "asneeded" },
  { id: "r3",  name: "Change HVAC / AC filters",       category: "repairs",   icon: "🌬️",  defaultFreq: "monthly"  },
  { id: "r4",  name: "Test smoke & CO detectors",      category: "repairs",   icon: "🔔",  defaultFreq: "monthly"  },
  { id: "r5",  name: "Touch-up painting / caulking",   category: "repairs",   icon: "🖌️",  defaultFreq: "asneeded" },
  { id: "r6",  name: "Pest control check",             category: "repairs",   icon: "🐛",  defaultFreq: "monthly"  },
];

const FREQ_LABELS: Record<Frequency, string> = {
  daily: "Daily", weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", asneeded: "As needed",
};

const ASSIGN_CONFIG: Record<AssignedTo, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  you:     { label: "You",     color: "text-teal-300",   bg: "bg-teal-500/20 border-teal-500/40",   icon: User    },
  partner: { label: "Partner", color: "text-cyan-300",   bg: "bg-cyan-500/20 border-cyan-500/40",   icon: User    },
  shared:  { label: "Shared",  color: "text-emerald-300",bg: "bg-emerald-500/20 border-emerald-500/40", icon: Users },
  skip:    { label: "Skip",    color: "text-slate-400",  bg: "bg-slate-700/40 border-slate-600/40", icon: Minus   },
};

const FREQ_ORDER: Frequency[] = ["daily", "weekly", "biweekly", "monthly", "asneeded"];

function nextFreq(f: Frequency): Frequency {
  const i = FREQ_ORDER.indexOf(f);
  return FREQ_ORDER[(i + 1) % FREQ_ORDER.length];
}

function nextAssign(a: AssignedTo): AssignedTo {
  const order: AssignedTo[] = ["you", "partner", "shared", "skip"];
  return order[(order.indexOf(a) + 1) % order.length];
}

interface ChoreState {
  assignments: ChoreAssignment[];
  customChores: CustomChore[];
}

interface ServerData {
  assignments: ChoreAssignment[];
  customChores: CustomChore[];
  partnerName?: string | null;
}

export default function ChoresDivider() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"list" | "summary">("list");
  const [newChoreName, setNewChoreName] = useState("");
  const [newChoreCategory, setNewChoreCategory] = useState("living");
  const [showAddChore, setShowAddChore] = useState(false);
  const [localState, setLocalState] = useState<ChoreState | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: serverData, isLoading } = useQuery<ServerData>({
    queryKey: ["/api/chores"],
    retry: false,
    select: (d) => d,
  });

  const saveMutation = useMutation({
    mutationFn: async (state: ChoreState) => {
      const res = await apiRequest("PUT", "/api/chores", state);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      toast({ title: "Chore list saved!", description: "Your assignments are saved and shared with your partner." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const state: ChoreState = localState ?? {
    assignments: serverData?.assignments ?? [],
    customChores: serverData?.customChores ?? [],
  };

  const partnerName = serverData?.partnerName || "Partner";

  const getAssignment = (choreId: string): ChoreAssignment => {
    const found = state.assignments.find(a => a.choreId === choreId);
    const chore = CHORES.find(c => c.id === choreId) || (state.customChores as CustomChore[]).find(c => c.id === choreId);
    return found ?? { choreId, assignedTo: "shared", frequency: (chore as Chore)?.defaultFreq ?? "weekly" };
  };

  const updateAssignment = (choreId: string, update: Partial<ChoreAssignment>) => {
    setLocalState(prev => {
      const base = prev ?? state;
      const exists = base.assignments.find(a => a.choreId === choreId);
      if (exists) {
        return { ...base, assignments: base.assignments.map(a => a.choreId === choreId ? { ...a, ...update } : a) };
      }
      const chore = CHORES.find(c => c.id === choreId);
      return {
        ...base,
        assignments: [...base.assignments, { choreId, assignedTo: "shared", frequency: chore?.defaultFreq ?? "weekly", ...update }],
      };
    });
  };

  const markDone = (choreId: string) => {
    updateAssignment(choreId, { lastCompleted: new Date().toISOString() });
    toast({ title: "Marked as done! ✓", description: "Nice work keeping the home running." });
  };

  const addCustomChore = () => {
    if (!newChoreName.trim()) return;
    const id = `custom_${Date.now()}`;
    const custom: CustomChore = { id, name: newChoreName.trim(), category: newChoreCategory, icon: "⭐" };
    setLocalState(prev => {
      const base = prev ?? state;
      return { ...base, customChores: [...base.customChores, custom] };
    });
    setNewChoreName("");
    setShowAddChore(false);
    toast({ title: "Custom chore added!" });
  };

  const removeCustomChore = (id: string) => {
    setLocalState(prev => {
      const base = prev ?? state;
      return {
        ...base,
        customChores: base.customChores.filter(c => c.id !== id),
        assignments: base.assignments.filter(a => a.choreId !== id),
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMutation.mutateAsync(state);
    } finally {
      setSaving(false);
    }
  };

  const toggleCat = (catId: string) => {
    setCollapsedCats(prev => {
      const s = new Set(prev);
      s.has(catId) ? s.delete(catId) : s.add(catId);
      return s;
    });
  };

  // Stats
  const stats = useMemo(() => {
    const allChores = [...CHORES, ...(state.customChores as Chore[])];
    const counts = { you: 0, partner: 0, shared: 0, skip: 0 };
    allChores.forEach(c => {
      const a = getAssignment(c.id);
      counts[a.assignedTo]++;
    });
    const total = allChores.length - counts.skip;
    const youPct  = total > 0 ? Math.round(((counts.you  + counts.shared * 0.5) / total) * 100) : 50;
    const prtPct  = total > 0 ? Math.round(((counts.partner + counts.shared * 0.5) / total) * 100) : 50;
    return { ...counts, total, youPct, prtPct };
  }, [state]);

  const hasPendingChanges = localState !== null;

  const allChoresInCat = (catId: string) => [
    ...CHORES.filter(c => c.category === catId),
    ...(state.customChores as CustomChore[]).filter(c => c.category === catId),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setLocation("/harmony-hub")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white leading-none">Chore Divider</h1>
            <p className="text-[10px] text-white/40 mt-0.5">Inside & outside — who does what</p>
          </div>
          {hasPendingChanges && (
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 h-auto"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
          )}
        </div>

        {/* Tab strip */}
        <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2">
          {(["list", "summary"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === tab
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-500/20"
                  : "bg-slate-800/60 text-white/50 hover:text-white"
              }`}
            >
              {tab === "list" ? "All Chores" : "Summary"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">

        {/* ── Summary tab ── */}
        {activeTab === "summary" && (
          <AnimatePresence>
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Fairness meter */}
              <Card className="bg-slate-800/60 border border-slate-700/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" /> Workload Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-teal-300 font-semibold">You  ({stats.youPct}%)</span>
                      <span className="text-cyan-300 font-semibold">({stats.prtPct}%) {partnerName}</span>
                    </div>
                    <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.youPct}%` }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white drop-shadow">
                          {stats.youPct === stats.prtPct ? "Even split ✓" : stats.youPct > stats.prtPct ? "You're carrying more" : `${partnerName} is carrying more`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(["you", "partner", "shared", "skip"] as AssignedTo[]).map(k => {
                      const cfg = ASSIGN_CONFIG[k];
                      return (
                        <div key={k} className={`rounded-xl p-2.5 text-center border ${cfg.bg}`}>
                          <p className={`text-lg font-black ${cfg.color}`}>{stats[k as keyof typeof stats]}</p>
                          <p className="text-[10px] text-white/50">{cfg.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Per-category breakdown */}
              {CATEGORIES.map(cat => {
                const chores = allChoresInCat(cat.id);
                if (chores.length === 0) return null;
                const yc = chores.filter(c => {
                  const a = getAssignment(c.id).assignedTo;
                  return a === "you" || a === "shared";
                }).length;
                const pc = chores.filter(c => {
                  const a = getAssignment(c.id).assignedTo;
                  return a === "partner" || a === "shared";
                }).length;
                return (
                  <Card key={cat.id} className={`${cat.color} border ${cat.border}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <cat.icon className={`w-4 h-4 ${cat.text}`} />
                          <span className={`text-xs font-bold ${cat.text}`}>{cat.label}</span>
                        </div>
                        <span className="text-[10px] text-white/40">{chores.length} chores</span>
                      </div>
                      <div className="space-y-1">
                        {chores.map(c => {
                          const a = getAssignment(c.id);
                          if (a.assignedTo === "skip") return null;
                          const cfg = ASSIGN_CONFIG[a.assignedTo];
                          return (
                            <div key={c.id} className="flex items-center justify-between">
                              <span className="text-[11px] text-white/60">{(c as Chore).icon || "⭐"} {c.name}</span>
                              <span className={`text-[10px] font-semibold ${cfg.color}`}>{a.assignedTo === "you" ? "You" : a.assignedTo === "partner" ? partnerName : "Shared"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── List tab ── */}
        {activeTab === "list" && (
          <div className="space-y-3">
            {/* Key */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["you", "partner", "shared", "skip"] as AssignedTo[]).map(k => {
                const cfg = ASSIGN_CONFIG[k];
                const label = k === "partner" ? partnerName : cfg.label;
                return (
                  <div key={k} className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                    <cfg.icon className="w-3 h-3" />
                    {label}
                  </div>
                );
              })}
              <span className="text-[10px] text-white/30 ml-auto">Tap to cycle</span>
            </div>

            {CATEGORIES.map(cat => {
              const chores = allChoresInCat(cat.id);
              if (chores.length === 0) return null;
              const isCollapsed = collapsedCats.has(cat.id);
              const assigned = chores.filter(c => getAssignment(c.id).assignedTo !== "skip").length;

              return (
                <Card key={cat.id} className={`${cat.color} border ${cat.border} overflow-hidden`}>
                  <button
                    className="w-full p-3 flex items-center justify-between"
                    onClick={() => toggleCat(cat.id)}
                  >
                    <div className="flex items-center gap-2">
                      <cat.icon className={`w-4 h-4 ${cat.text}`} />
                      <span className={`text-sm font-bold ${cat.text}`}>{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">{assigned}/{chores.length}</span>
                      {isCollapsed
                        ? <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                        : <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                      }
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="px-2 pb-2 space-y-1">
                      {chores.map(c => {
                        const a = getAssignment(c.id);
                        const cfg = ASSIGN_CONFIG[a.assignedTo];
                        const assignLabel = a.assignedTo === "partner" ? partnerName : cfg.label;
                        const daysAgo = a.lastCompleted
                          ? Math.floor((Date.now() - new Date(a.lastCompleted).getTime()) / 86400000)
                          : null;
                        const isCustom = (state.customChores as CustomChore[]).some(cc => cc.id === c.id);

                        return (
                          <motion.div
                            key={c.id}
                            layout
                            className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2"
                          >
                            <span className="text-base w-6 flex-shrink-0">{(c as Chore).icon || "⭐"}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white/80 font-medium leading-tight truncate">{c.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  onClick={() => updateAssignment(c.id, { frequency: nextFreq(a.frequency) })}
                                  className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
                                >
                                  {FREQ_LABELS[a.frequency]}
                                </button>
                                {daysAgo !== null && (
                                  <span className={`text-[9px] ${daysAgo > 14 ? "text-orange-400" : "text-emerald-400"}`}>
                                    · done {daysAgo === 0 ? "today" : `${daysAgo}d ago`}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Mark done */}
                            <button
                              onClick={() => markDone(c.id)}
                              className="p-1 rounded-lg hover:bg-emerald-500/20 transition-colors flex-shrink-0"
                              title="Mark done"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-white/20 hover:text-emerald-400" />
                            </button>

                            {/* Assign toggle */}
                            <button
                              onClick={() => updateAssignment(c.id, { assignedTo: nextAssign(a.assignedTo) })}
                              className={`flex-shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${cfg.bg} ${cfg.color}`}
                            >
                              {assignLabel}
                            </button>

                            {/* Remove custom */}
                            {isCustom && (
                              <button onClick={() => removeCustomChore(c.id)} className="p-1 hover:text-red-400 text-white/20 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </motion.div>
                        );
                      })}

                      {/* Add custom chore inline */}
                      {showAddChore && newChoreCategory === cat.id ? (
                        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 mt-1">
                          <Input
                            value={newChoreName}
                            onChange={e => setNewChoreName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addCustomChore()}
                            placeholder="Chore name…"
                            className="flex-1 bg-transparent border-0 p-0 text-xs text-white placeholder:text-white/30 focus-visible:ring-0 h-auto"
                            autoFocus
                          />
                          <button onClick={addCustomChore} className="text-teal-400 hover:text-teal-300 text-xs font-semibold">Add</button>
                          <button onClick={() => setShowAddChore(false)} className="text-white/30 hover:text-white/60"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setNewChoreCategory(cat.id); setShowAddChore(true); }}
                          className="w-full flex items-center gap-1.5 text-[10px] text-white/25 hover:text-white/50 transition-colors py-1.5 px-3"
                        >
                          <Plus className="w-3 h-3" /> Add custom chore
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating save bar */}
      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/[0.07] px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-white/70 font-medium">Unsaved changes</p>
              <p className="text-[10px] text-white/30">Saved assignments are shared with {partnerName}</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save & Share
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
