import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import HarmonyNav from "@/components/HarmonyNav";
import {
  Heart, Camera, Gift, Star, Clock, Home, Baby, PawPrint,
  Plane, Sparkles, Plus, Share2, X, ChevronDown, ChevronUp,
  Image as ImageIcon, Check, Twitter, Facebook, Instagram, Link2,
  CalendarHeart, Trophy, Flame,
} from "lucide-react";
import type { LoveJarItem, CoupleMilestone, CoupleProfile } from "@shared/schema";

// ── Types ────────────────────────────────────────────────────────────────────
const JAR_TYPES = [
  { id: "i_love_you_because",    label: "I Love You Because…",   emoji: "💕", color: "from-rose-500/20 to-pink-500/20",   border: "border-rose-500/30" },
  { id: "do_you_remember",       label: "Do You Remember When…", emoji: "🌟", color: "from-amber-500/20 to-yellow-500/20", border: "border-amber-500/30" },
  { id: "im_grateful_for",       label: "I'm Grateful For…",     emoji: "🙏", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30" },
  { id: "your_awesome_because",  label: "You're Awesome Because…",emoji: "⭐", color: "from-violet-500/20 to-purple-500/20",border: "border-violet-500/30" },
  { id: "favorite_memory",       label: "Favorite Memory",        emoji: "📸", color: "from-blue-500/20 to-cyan-500/20",   border: "border-blue-500/30" },
  { id: "photo",                 label: "Favorite Photo",         emoji: "🖼️", color: "from-pink-500/20 to-rose-600/20",  border: "border-pink-500/30" },
] as const;

const MILESTONE_PRESETS = [
  { type: "first_home",  emoji: "🏠", label: "First Home Together" },
  { type: "baby",        emoji: "👶", label: "Baby" },
  { type: "pet",         emoji: "🐾", label: "Pet" },
  { type: "travel",      emoji: "✈️", label: "Travel Together" },
  { type: "engagement",  emoji: "💍", label: "Engagement" },
  { type: "wedding",     emoji: "💒", label: "Wedding" },
  { type: "anniversary", emoji: "🥂", label: "Anniversary" },
  { type: "custom",      emoji: "🎉", label: "Custom Milestone" },
];

// ── Countdown Helper ─────────────────────────────────────────────────────────
function useCountdown(dateStr: string | undefined) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!dateStr) { setDays(null); return; }
    const calc = () => {
      const now = new Date();
      const target = new Date(dateStr);
      // Next anniversary: set year to current or next
      const next = new Date(target);
      next.setFullYear(now.getFullYear());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setDays(diff);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [dateStr]);
  return days;
}

// ── Shareable Card Component ─────────────────────────────────────────────────
function ShareableCard({ content, type }: { content: string; type: typeof JAR_TYPES[number] }) {
  const [copied, setCopied] = useState(false);
  const text = `${type.emoji} ${type.label}: "${content}" — shared on SyncWithInsight.com`;

  const share = (platform: string) => {
    const urls: Record<string, string> = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://syncwithinsight.com")}&quote=${encodeURIComponent(text)}`,
      instagram: `https://www.instagram.com/`,
      tiktok:   `https://www.tiktok.com/`,
    };
    window.open(urls[platform] || "#", "_blank");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${type.color} border ${type.border} p-5`}>
      <div className="text-2xl mb-2">{type.emoji}</div>
      <p className="text-sm font-semibold text-white/80 mb-1">{type.label}</p>
      <p className="text-white text-sm leading-relaxed italic mb-4">"{content}"</p>
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => share("twitter")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1da1f2]/20 hover:bg-[#1da1f2]/35 border border-[#1da1f2]/30 text-[#1da1f2] text-xs font-bold transition-all">
          <Twitter className="w-3 h-3" /> Twitter
        </button>
        <button onClick={() => share("facebook")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877f2]/20 hover:bg-[#1877f2]/35 border border-[#1877f2]/30 text-[#1877f2] text-xs font-bold transition-all">
          <Facebook className="w-3 h-3" /> Facebook
        </button>
        <button onClick={() => share("instagram")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-500/30 text-pink-300 text-xs font-bold transition-all">
          <Instagram className="w-3 h-3" /> Instagram
        </button>
        <button onClick={() => share("tiktok")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all">
          🎵 TikTok
        </button>
        <button onClick={copyLink} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/15 text-white/60 text-xs font-bold transition-all">
          {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HarmonySharedSpace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"jar" | "milestones" | "my-jar">("jar");
  const [jarType, setJarType] = useState<string>("i_love_you_because");
  const [jarText, setJarText] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shareCard, setShareCard] = useState<LoveJarItem | null>(null);

  // Milestone form
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "", milestoneType: "custom", achieved: false,
    achievedDate: "", targetDate: "", notes: "", emoji: "🎉",
  });

  // Fetch couple profile
  const { data: profile } = useQuery<CoupleProfile>({
    queryKey: ["/api/couples/profile"],
  });

  const coupleCode = profile?.coupleCode;
  const partnerId = profile?.partner1Id === (user as any)?.id
    ? profile?.partner2Id
    : profile?.partner1Id;

  const daysToAnniversary = useCountdown(profile?.anniversary ?? undefined);

  // Calculate years together
  const yearsTogether = profile?.anniversary
    ? Math.floor((Date.now() - new Date(profile.anniversary).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  // Fetch love jar items in MY jar
  const { data: myJarItems = [] } = useQuery<LoveJarItem[]>({
    queryKey: ["/api/harmony/love-jar/mine"],
    enabled: !!user,
  });

  // Fetch sent items
  const { data: sentItems = [] } = useQuery<LoveJarItem[]>({
    queryKey: ["/api/harmony/love-jar/sent"],
    enabled: !!user,
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery<CoupleMilestone[]>({
    queryKey: ["/api/harmony/milestones", coupleCode],
    enabled: !!coupleCode,
    queryFn: async () => {
      if (!coupleCode) return [];
      const r = await fetch(`/api/harmony/milestones/${coupleCode}`);
      return r.json();
    },
  });

  // Add jar item mutation
  const addJarMutation = useMutation({
    mutationFn: async (data: { coupleCode: string; toUserId: string; itemType: string; content?: string; photoUrl?: string }) =>
      (await apiRequest("POST", "/api/harmony/love-jar", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harmony/love-jar/sent"] });
      setJarText("");
      setPhotoPreview(null);
      setPhotoFile(null);
      toast({ title: "Dropped into their jar 💕", description: "Your partner will see it next time they open their jar!" });
    },
    onError: () => toast({ title: "Couldn't add to jar", variant: "destructive" }),
  });

  // Add milestone mutation
  const addMilestoneMutation = useMutation({
    mutationFn: async (data: any) => (await apiRequest("POST", "/api/harmony/milestones", data)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/harmony/milestones", coupleCode] });
      setShowMilestoneForm(false);
      setMilestoneForm({ title: "", milestoneType: "custom", achieved: false, achievedDate: "", targetDate: "", notes: "", emoji: "🎉" });
      toast({ title: "Milestone added! 🎉", description: "Your shared journey just got richer." });
    },
    onError: () => toast({ title: "Couldn't add milestone", variant: "destructive" }),
  });

  // Toggle milestone achieved
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ id, achieved }: { id: string; achieved: boolean }) =>
      (await apiRequest("PATCH", `/api/harmony/milestones/${id}`, { achieved })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/harmony/milestones", coupleCode] }),
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendToJar = () => {
    if (!coupleCode || !partnerId) {
      return toast({ title: "Link your partner first", description: "Use the invite code in Harmony settings.", variant: "destructive" });
    }
    if (jarType === "photo") {
      if (!photoPreview) return toast({ title: "Please select a photo", variant: "destructive" });
      addJarMutation.mutate({ coupleCode, toUserId: partnerId, itemType: "photo", photoUrl: photoPreview });
    } else {
      if (!jarText.trim()) return toast({ title: "Write something first 💕", variant: "destructive" });
      addJarMutation.mutate({ coupleCode, toUserId: partnerId, itemType: jarType, content: jarText.trim() });
    }
  };

  const activeJarType = JAR_TYPES.find(t => t.id === jarType) ?? JAR_TYPES[0];
  const achievedMilestones = milestones.filter(m => m.achieved);
  const upcomingMilestones = milestones.filter(m => !m.achieved);
  const unreadCount = myJarItems.filter(i => !i.seenAt).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0816] via-violet-950/30 to-[#0b0816] pb-24">
      <HarmonyNav />

      <div className="max-w-3xl mx-auto px-4 pt-20">

        {/* ── Header + Anniversary Countdown ──────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/15 border border-violet-400/20 mb-4">
            <Heart className="w-4 h-4 text-violet-400 fill-violet-400/50" />
            <span className="text-violet-300 text-sm font-semibold">Our Shared Space</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">
            {profile?.partner1Name && profile?.partner2Name
              ? `${profile.partner1Name} & ${profile.partner2Name}`
              : "Your Love Story"}
          </h1>

          {/* Anniversary countdown */}
          {profile?.anniversary && (
            <div className="mt-4 inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-violet-500/15 border border-rose-400/20">
              <div className="flex items-center gap-2">
                <CalendarHeart className="w-5 h-5 text-rose-400" />
                <span className="text-rose-300 font-bold text-sm">Anniversary Countdown</span>
              </div>
              {yearsTogether !== null && yearsTogether > 0 && (
                <p className="text-white/50 text-xs">{yearsTogether} beautiful year{yearsTogether !== 1 ? "s" : ""} together</p>
              )}
              {daysToAnniversary !== null && (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-4xl font-black text-rose-300">{daysToAnniversary}</div>
                    <div className="text-xs text-white/40 font-medium">days to go</div>
                  </div>
                  {daysToAnniversary <= 7 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 animate-pulse">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-300 text-xs font-bold">Almost here!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!profile?.anniversary && (
            <p className="text-white/30 text-sm mt-2">Set your anniversary date in <a href="/couples-onboarding" className="text-violet-400 underline">Harmony settings</a></p>
          )}
        </div>

        {/* ── Tab Navigation ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 mb-8">
          {([
            { id: "jar",        label: "Fill Their Jar", emoji: "💕" },
            { id: "my-jar",     label: `My Jar${unreadCount > 0 ? ` (${unreadCount})` : ""}`, emoji: "🎁" },
            { id: "milestones", label: "Our Journey",    emoji: "🗺️" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-violet-500/25 text-violet-200 border border-violet-500/30 shadow-lg"
                  : "text-white/40 hover:text-white/65"
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══ TAB: FILL THEIR JAR ════════════════════════════════════════════ */}
        {activeTab === "jar" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-1">Fill Their Jar With Love</h2>
              <p className="text-white/40 text-sm">Your partner gets a beautiful jar to open — fill it with your heart</p>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {JAR_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => { setJarType(type.id); setJarText(""); setPhotoPreview(null); }}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                    jarType === type.id
                      ? `bg-gradient-to-br ${type.color} ${type.border} border shadow-lg scale-[1.02]`
                      : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className={`text-[11px] font-bold text-center leading-tight ${jarType === type.id ? "text-white" : "text-white/50"}`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className={`rounded-2xl bg-gradient-to-br ${activeJarType.color} border ${activeJarType.border} p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{activeJarType.emoji}</span>
                <p className="text-white font-bold text-sm">{activeJarType.label}</p>
              </div>

              {jarType === "photo" ? (
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                  {photoPreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={photoPreview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl" />
                      <button
                        onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-white/20 text-white/40 hover:text-white/60 hover:border-white/35 transition-all"
                    >
                      <Camera className="w-8 h-8" />
                      <span className="text-sm font-medium">Tap to choose a favorite photo</span>
                    </button>
                  )}
                  {photoPreview && (
                    <Textarea
                      value={jarText}
                      onChange={e => setJarText(e.target.value)}
                      placeholder="Add a caption or memory… (optional)"
                      rows={2}
                      className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/25 text-sm resize-none"
                    />
                  )}
                </div>
              ) : (
                <Textarea
                  value={jarText}
                  onChange={e => setJarText(e.target.value)}
                  placeholder={
                    jarType === "i_love_you_because"   ? "…you always make me feel seen even on my worst days"
                    : jarType === "do_you_remember"    ? "…that night we got lost and ended up at that little diner?"
                    : jarType === "im_grateful_for"    ? "…the way you hold space for me without judgment"
                    : jarType === "your_awesome_because" ? "…you never give up, even when it's hard"
                    : "Share a memory that makes your heart smile…"
                  }
                  rows={4}
                  className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/25 text-sm resize-none"
                />
              )}

              <Button
                onClick={handleSendToJar}
                disabled={addJarMutation.isPending || (!jarText.trim() && !photoPreview)}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 hover:from-violet-400 hover:to-rose-400 text-white font-black shadow-lg transition-all disabled:opacity-40"
              >
                <Gift className="w-4 h-4 mr-2" />
                {addJarMutation.isPending ? "Dropping in…" : "Drop into Their Jar 💕"}
              </Button>

              {!coupleCode && (
                <p className="text-center text-xs text-white/30 mt-2">
                  Link your partner's account first — use the invite code in <a href="/couples-onboarding" className="text-violet-400 underline">settings</a>
                </p>
              )}
            </div>

            {/* Sent items preview */}
            {sentItems.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">Things You've Sent ({sentItems.length})</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {sentItems.map(item => {
                    const type = JAR_TYPES.find(t => t.id === item.itemType) ?? JAR_TYPES[0];
                    return (
                      <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r ${type.color} border ${type.border}`}>
                        <span className="text-lg shrink-0">{type.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/50 font-bold mb-0.5">{type.label}</p>
                          {item.photoUrl
                            ? <img src={item.photoUrl} alt="Photo" className="h-20 rounded-lg object-cover" />
                            : <p className="text-white/80 text-xs leading-relaxed truncate">{item.content}</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: MY JAR ════════════════════════════════════════════════════ */}
        {activeTab === "my-jar" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-3">🫙</div>
              <h2 className="text-xl font-bold text-white mb-1">Your Love Jar</h2>
              <p className="text-white/40 text-sm">
                {myJarItems.length === 0
                  ? "Your jar is waiting to be filled by your partner 💕"
                  : `${myJarItems.length} treasure${myJarItems.length !== 1 ? "s" : ""} inside — click any to read & share`}
              </p>
            </div>

            {myJarItems.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
                <Heart className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Ask your partner to drop something into your jar!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myJarItems.map(item => {
                  const type = JAR_TYPES.find(t => t.id === item.itemType) ?? JAR_TYPES[0];
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className={`p-5 rounded-2xl bg-gradient-to-br ${type.color} border ${type.border}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{type.emoji}</span>
                            <span className="text-xs font-bold text-white/60">{type.label}</span>
                          </div>
                          <span className="text-[10px] text-white/30">
                            {new Date(item.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                        {item.photoUrl ? (
                          <div>
                            <img src={item.photoUrl} alt="Shared photo" className="w-full max-h-72 object-cover rounded-xl mb-2" />
                            {item.content && <p className="text-white/80 text-sm italic">"{item.content}"</p>}
                          </div>
                        ) : (
                          <p className="text-white text-sm leading-relaxed italic">"{item.content}"</p>
                        )}
                      </div>

                      {/* Share card */}
                      {item.content && (
                        <div>
                          <button
                            onClick={() => setShareCard(shareCard?.id === item.id ? null : item)}
                            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-violet-400 transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            {shareCard?.id === item.id ? "Hide share options" : "Share this love note"}
                          </button>
                          {shareCard?.id === item.id && (
                            <div className="mt-2">
                              <ShareableCard content={item.content!} type={type} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: MILESTONES ════════════════════════════════════════════════ */}
        {activeTab === "milestones" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Our Journey Together</h2>
                <p className="text-white/40 text-sm">Milestones achieved & dreams still ahead</p>
              </div>
              <Button
                onClick={() => setShowMilestoneForm(f => !f)}
                className="rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 font-bold text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {/* Add milestone form */}
            {showMilestoneForm && (
              <div className="rounded-2xl bg-violet-500/10 border border-violet-500/25 p-5 space-y-3">
                <h3 className="font-bold text-white text-sm">Add a Milestone</h3>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {MILESTONE_PRESETS.map(preset => (
                    <button
                      key={preset.type}
                      onClick={() => setMilestoneForm(f => ({ ...f, milestoneType: preset.type, emoji: preset.emoji, title: f.title || preset.label }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center ${
                        milestoneForm.milestoneType === preset.type
                          ? "bg-violet-500/25 border-violet-400/40"
                          : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="text-lg">{preset.emoji}</span>
                      <span className="text-[9px] text-white/50 leading-tight">{preset.label.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>

                <Input
                  value={milestoneForm.title}
                  onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What's the milestone?"
                  className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 text-sm"
                />

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={milestoneForm.achieved}
                      onChange={e => setMilestoneForm(f => ({ ...f, achieved: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-white/70">Already achieved</span>
                  </label>
                  <div />
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">{milestoneForm.achieved ? "Date achieved" : "Target date"}</label>
                    <Input
                      type="date"
                      value={milestoneForm.achieved ? milestoneForm.achievedDate : milestoneForm.targetDate}
                      onChange={e => {
                        if (milestoneForm.achieved) setMilestoneForm(f => ({ ...f, achievedDate: e.target.value }));
                        else setMilestoneForm(f => ({ ...f, targetDate: e.target.value }));
                      }}
                      className="bg-white/[0.06] border-white/15 text-white text-sm"
                    />
                  </div>
                </div>

                <Textarea
                  value={milestoneForm.notes}
                  onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes or feelings about this milestone…"
                  rows={2}
                  className="bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 text-sm resize-none"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => addMilestoneMutation.mutate({ ...milestoneForm, coupleCode })}
                    disabled={!milestoneForm.title.trim() || !coupleCode || addMilestoneMutation.isPending}
                    className="flex-1 bg-violet-500 hover:bg-violet-400 text-white font-bold"
                  >
                    {addMilestoneMutation.isPending ? "Saving…" : "Save Milestone"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowMilestoneForm(false)}
                    className="text-white/40 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Achieved milestones */}
            {achievedMilestones.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Together We've Done It ({achievedMilestones.length})</h3>
                </div>
                <div className="grid gap-3">
                  {achievedMilestones.map(m => (
                    <div key={m.id} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/20">
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{m.title}</p>
                        {m.achievedDate && (
                          <p className="text-xs text-white/40 mt-0.5">
                            {new Date(m.achievedDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                          </p>
                        )}
                        {m.notes && <p className="text-xs text-white/50 mt-1 italic">{m.notes}</p>}
                      </div>
                      <span className="text-emerald-400 shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming / dreams */}
            {upcomingMilestones.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider">Dreams Still Ahead ({upcomingMilestones.length})</h3>
                </div>
                <div className="grid gap-3">
                  {upcomingMilestones.map(m => (
                    <div key={m.id} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{m.title}</p>
                        {m.targetDate && (
                          <p className="text-xs text-violet-400/70 mt-0.5">
                            Aiming for {new Date(m.targetDate).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                          </p>
                        )}
                        {m.notes && <p className="text-xs text-white/50 mt-1 italic">{m.notes}</p>}
                      </div>
                      <button
                        onClick={() => toggleMilestoneMutation.mutate({ id: m.id, achieved: true })}
                        className="shrink-0 w-6 h-6 rounded-full border-2 border-violet-400/40 hover:border-emerald-400/60 hover:bg-emerald-500/10 transition-all"
                        title="Mark as achieved"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {milestones.length === 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
                <Star className="w-10 h-10 text-white/15 mx-auto mb-3" />
                <p className="text-white/30 text-sm">Add your first shared milestone — first home, baby, pet, travel, or any moment that matters</p>
              </div>
            )}
          </div>
        )}

        {/* ── Gratitude Cards — Always Visible ────────────────────────────── */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Quick Appreciation Cards</h3>
            <span className="text-xs text-white/30">— shareable on any platform</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { type: JAR_TYPES[2], prompt: "I'm grateful for the way you…" },
              { type: JAR_TYPES[3], prompt: "You're awesome because…" },
            ].map(({ type, prompt }) => {
              const [val, setVal] = useState("");
              const [submitted, setSubmitted] = useState(false);
              return (
                <div key={type.id} className={`rounded-2xl bg-gradient-to-br ${type.color} border ${type.border} p-5`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{type.emoji}</span>
                    <p className="text-white font-bold text-sm">{type.label}</p>
                  </div>
                  {!submitted ? (
                    <>
                      <Input
                        value={val}
                        onChange={e => setVal(e.target.value)}
                        placeholder={prompt}
                        className="bg-white/[0.08] border-white/15 text-white placeholder:text-white/25 text-sm mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (!val.trim()) return;
                            if (coupleCode && partnerId) {
                              addJarMutation.mutate({ coupleCode, toUserId: partnerId, itemType: type.id, content: val.trim() });
                            }
                            setSubmitted(true);
                          }}
                          className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15"
                        >
                          <Gift className="w-3.5 h-3.5 mr-1.5" /> Send to Jar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <ShareableCard content={val} type={type} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
