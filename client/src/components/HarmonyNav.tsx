import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, Home, MessageCircle, Sprout, Gift,
  ChevronDown, ArrowLeft, Settings, LogOut, User, Clock,
  Menu, Diamond, Star, Shield, ShieldCheck, Phone,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/harmony-hub",         icon: Home,          label: "Home",      testId: "harmony-nav-home" },
  { path: "/couple-coaching",     icon: MessageCircle, label: "Coaching",  testId: "harmony-nav-coaching" },
  { path: "/harmony",             icon: Heart,         label: "AI Coach",  testId: "harmony-nav-ai", hideOnMobile: true },
  { path: "/harmony-growth",      icon: Sprout,        label: "Growth",    testId: "harmony-nav-growth" },
  { path: "/harmony-shared-space",icon: Star,          label: "Our Space", testId: "harmony-nav-shared-space" },
  { path: "/compliment-jar",      icon: Gift,          label: "Jar",       testId: "harmony-nav-jar", hideOnMobile: true },
];

export default function HarmonyNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const logoutMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/auth/logout")).json(),
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Logged out", description: "See you next time!" });
      setLocation("/login");
    },
  });

  const addCoachingMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/harmony/checkout-coaching", {})).json(),
    onSuccess: (data: { checkoutUrl: string }) => {
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    },
    onError: () => toast({ title: "Could not start checkout", description: "Please try again.", variant: "destructive" }),
  });

  const switchModeMutation = useMutation({
    mutationFn: async (mode: string) =>
      (await apiRequest("POST", "/api/user/set-mode", { mode })).json(),
    onSuccess: (_data, mode) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Mode switched", description: mode === "matching" ? "Welcome to Eros" : "Welcome to Harmony" });
      setLocation(mode === "matching" ? "/" : "/harmony-hub");
      setMenuOpen(false);
    },
    onError: () => toast({ title: "Could not switch mode", variant: "destructive" }),
  });

  const homeRoutes = ["/harmony-hub", "/"];
  const showBack = !homeRoutes.includes(location);
  const isActive = (path: string) => location === path || (path === "/harmony-hub" && location === "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-500">
      <div className="flex items-center justify-between nav-elevate px-3 sm:px-5 py-2.5 shadow-2xl shadow-black/60">

        {/* Left: back + brand */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] transition-all text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline text-[11px] font-medium">Back</span>
            </button>
          )}
          <button
            onClick={() => setLocation("/harmony-hub")}
            data-testid="harmony-nav-brand"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/85 to-purple-500/85 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:from-violet-500 hover:to-purple-400 transition-all active:scale-95"
          >
            <Heart className="h-4 w-4 fill-white/80" />
            <span className="hidden sm:inline">Harmony</span>
          </button>
        </div>

        {/* Centre: page links — hidden on mobile (handled by MobileBottomNav) */}
        <div className="hidden sm:flex items-center gap-0 sm:gap-0.5 bg-white/[0.03] rounded-xl px-0.5 py-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                data-testid={item.testId}
                title={item.label}
                className={`relative flex flex-col items-center gap-0.5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 group ${
                  (item as any).hideOnMobile ? "hidden sm:flex" : "flex"
                } ${active ? "bg-violet-500/15 text-violet-300" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"}`}
              >
                <Icon className={`h-[17px] w-[17px] transition-all ${active ? "text-violet-400" : "group-hover:text-white/80"}`} />
                <span className={`text-[10px] sm:text-[11px] font-medium leading-none ${active ? "text-violet-300" : "text-white/35 group-hover:text-white/65"}`}>
                  {item.label}
                </span>
                {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-violet-400 rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Right: coaching time + profile */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <button
            onClick={() => addCoachingMutation.mutate()}
            disabled={addCoachingMutation.isPending}
            title="Add coaching time"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-violet-500/10 border border-violet-400/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-all disabled:opacity-50"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>+Time</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              data-testid="harmony-nav-profile-menu"
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-white/[0.05] transition-all group"
              aria-label="Open menu"
            >
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 ring-2 ring-violet-400/30 group-hover:ring-violet-400/55 transition-all">
                <AvatarImage src={user?.profileImage} alt={user?.name || "Profile"} />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-700 text-white font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={`w-3 h-3 text-white/50 group-hover:text-white/80 transition-all hidden sm:block ${menuOpen ? "rotate-180" : ""}`} />
              <Menu className="w-3.5 h-3.5 text-white/50 group-hover:text-white/80 transition-all sm:hidden" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#100d1a] border border-violet-400/15 rounded-2xl shadow-2xl shadow-black z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-white/[0.07] bg-gradient-to-r from-violet-500/10 to-purple-500/10">
                  <p className="text-sm font-semibold text-white">{user?.name || "User"}</p>
                  <p className="text-xs text-white/40 mt-0.5">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-semibold">
                    <Heart className="w-2.5 h-2.5 fill-violet-300/50" /> Harmony Mode
                  </span>
                </div>

                {/* Switch Mode — Elite gets direct hub access */}
                <div className="p-1.5 border-b border-white/[0.07]">
                  {(user as any)?.subscriptionTier === 'elite' ? (
                    <>
                      <p className="px-3 py-1 text-[10px] font-semibold text-yellow-400/70 uppercase tracking-wider flex items-center gap-1">
                        <Diamond className="w-2.5 h-2.5" /> Switch Platform
                      </p>
                      <button
                        onClick={() => { setLocation("/eros-hub"); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Heart className="h-4 w-4 text-rose-400 fill-rose-400/30" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-rose-300">Eros — Dating</span>
                          <span className="text-[11px] text-white/35">Browse matches, messages</span>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="px-3 py-1 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Switch Platform</p>
                      <button
                        onClick={() => switchModeMutation.mutate("matching")}
                        disabled={switchModeMutation.isPending}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-rose-500/10 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Heart className="h-4 w-4 text-rose-400 fill-rose-400/30" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-rose-300">Eros — Dating</span>
                          <span className="text-[11px] text-white/35">Browse matches, messages</span>
                        </div>
                      </button>
                    </>
                  )}
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button onClick={() => { setLocation("/account-settings"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] rounded-xl transition-colors">
                    <Settings className="h-4 w-4 text-white/40" /> Settings
                  </button>
                  <button onClick={() => { setLocation("/harmony"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-violet-500/[0.08] rounded-xl transition-colors sm:hidden">
                    <Heart className="h-4 w-4 text-violet-400" /> AI Coach
                  </button>
                  <button onClick={() => { setLocation("/harmony-shared-space"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-violet-500/[0.08] rounded-xl transition-colors">
                    <Star className="h-4 w-4 text-violet-300" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Our Shared Space</span>
                      <span className="text-[11px] text-white/35">Love jar, milestones & anniversary</span>
                    </div>
                  </button>
                  <button onClick={() => { setLocation("/compliment-jar"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-violet-500/[0.08] rounded-xl transition-colors sm:hidden">
                    <Gift className="h-4 w-4 text-violet-400/60" /> Compliment Jar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); addCoachingMutation.mutate(); }}
                    disabled={addCoachingMutation.isPending}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-violet-300 hover:bg-violet-500/10 rounded-xl transition-colors border border-violet-500/20 disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4 text-violet-400" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Add Coaching Time</span>
                      <span className="text-[11px] text-white/40">+3 hours · $39.99</span>
                    </div>
                  </button>
                  <div className="border-t border-white/[0.07] mt-1 pt-1">
                    <p className="px-3 py-1 text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" /> Safety
                    </p>
                    <button onClick={() => { setLocation("/safe-date"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-emerald-500/10 rounded-xl transition-colors">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <div className="flex flex-col items-start">
                        <span className="text-emerald-300 font-medium">Safe Date Mode</span>
                        <span className="text-[11px] text-white/35">Activate before every date</span>
                      </div>
                    </button>
                    <button onClick={() => { setLocation("/guardian"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] rounded-xl transition-colors">
                      <ShieldCheck className="h-4 w-4 text-violet-400" /> Guardian AI
                    </button>
                    <button onClick={() => { setLocation("/emergency-contacts"); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] rounded-xl transition-colors">
                      <Phone className="h-4 w-4 text-rose-400" /> Emergency Contacts
                    </button>
                  </div>
                  <div className="border-t border-white/[0.07] mt-1 pt-1">
                    <button
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400/80 hover:bg-red-500/[0.08] rounded-xl transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {logoutMutation.isPending ? "Logging out…" : "Log Out"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
