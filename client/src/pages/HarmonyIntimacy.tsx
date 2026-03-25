import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  ArrowLeft, Flame, Sparkles, Heart, Star, Shuffle, MapPin,
  ShoppingBag, Moon, Sun, ChevronDown, ChevronUp, ExternalLink, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Dice Themes ────────────────────────────────────────────────────────────
const DICE_THEMES = [
  { emoji: '🎲', title: 'Slow & Tender', desc: 'Candlelight, slow music, total presence — no rush.' },
  { emoji: '🌹', title: 'Old Hollywood Romance', desc: 'Dress up, sip wine, pretend you\'re meeting for the first time.' },
  { emoji: '🔥', title: 'Bold Initiator', desc: 'One partner leads the whole evening — surprises only.' },
  { emoji: '🌊', title: 'Sensory Journey', desc: 'Blindfold, massage oil, music — engage every sense.' },
  { emoji: '🏨', title: 'Hotel Night In', desc: 'Strip your bedroom bare. Room service, "Do Not Disturb." Act like guests.' },
  { emoji: '💌', title: 'Love Letter Night', desc: 'Write each other a letter first. Read them aloud. Then close the distance.' },
  { emoji: '🌙', title: 'Midnight Only', desc: 'Wait until after midnight. Build anticipation all day.' },
  { emoji: '☀️', title: 'Morning Ritual', desc: 'Start the day together — unhurried, warm, intentional.' },
];

// ─── 29 Ways to Connect ─────────────────────────────────────────────────────
const CONNECTION_TYPES = [
  { cat: 'Emotional', items: ['Whisper what you love most', 'Share a secret you\'ve never told anyone', 'Ask "What do you need tonight?"', 'Hold each other in silence for 5 minutes', 'Tell the story of when you fell for them'] },
  { cat: 'Physical', items: ['Full-body massage with no agenda', 'Eye-gazing for 4 minutes', 'Dance together in the kitchen', 'Synchronize your breathing lying down', 'Long, slow embrace — no talking'] },
  { cat: 'Playful', items: ['Take a bath together with bath bombs', 'Recreate your first date in miniature', 'Tickle fight followed by a cuddle', 'Cook a meal together naked', 'Play truth or dare — couples edition'] },
  { cat: 'Adventurous', items: ['Try one position neither of you has before', 'Book a surprise local hotel for one night', 'Leave a suggestive note somewhere they\'ll find it', 'Create a signature couple cocktail', 'Spend a weekend with zero phones'] },
  { cat: 'Spiritual', items: ['Meditate together before bed', 'Write your 5-year vision as a couple', 'Name 5 things you\'re grateful about each other', 'Create a ritual that\'s yours alone', 'Discuss a dream you both share'] },
  { cat: 'Playfully Spicy', items: ['Lingerie surprise delivery', 'Introduce one new toy together', 'Role-play a scenario you\'ve talked about', 'Watch something sensual together and discuss', 'Plan a themed weekend (see ideas below)'] },
];

// ─── Holiday / Seasonal Themes ──────────────────────────────────────────────
const HOLIDAY_THEMES = [
  { emoji: '🍀', holiday: "St. Patrick's Day", ideas: ['Irish whiskey tasting for two', 'Lucky clover body paint', 'Green-themed picnic at home', 'Irish pub game night → private after-party'] },
  { emoji: '💘', holiday: "Valentine's Day", ideas: ['Recreate your first kiss moment', '29 love notes hidden around the house', 'Spa day then dinner then dancing', 'Write each other\'s perfect evening — swap and do both'] },
  { emoji: '🎃', holiday: "Halloween", ideas: ['Couples costume reveal — then costume OFF', 'Spooky movie marathon + cozy blanket nest', 'Haunted hotel weekend', 'Sexy witch/wizard role-play'] },
  { emoji: '🎄', holiday: "Winter Holidays", ideas: ['12 days of intimacy calendar', 'Holiday lingerie under the sweater', 'Hot cocoa + bath salts spa night', 'Airbnb cabin weekend for two'] },
  { emoji: '🌸', holiday: "Spring Renewal", ideas: ['Outdoor picnic + wildflower picking', 'Spring cleaning → fresh bedroom refresh', 'Sunrise hike and breakfast in bed after', 'Botanical garden date → hotel'] },
  { emoji: '🏖️', holiday: "Summer", ideas: ['Late-night skinny dip', 'Road trip with no destination', 'Outdoor film night in the backyard', 'Book a beach house for a weekend'] },
];

// ─── Weekend Getaway Ideas ──────────────────────────────────────────────────
const GETAWAY_IDEAS = [
  { type: 'Romantic Cabin', desc: 'Mountain or lakeside. Fireplace, no TV, no wifi.', icon: '🏕️', tag: 'Most Popular' },
  { type: 'City Hotel', desc: 'Dress up. Room service. Spa. Rooftop bar.', icon: '🏙️', tag: 'Classic' },
  { type: 'Vineyard Stay', desc: 'Wine tastings, sunset walks, slow mornings.', icon: '🍷', tag: 'Elevated' },
  { type: 'Beachside Cottage', desc: 'Ocean sounds, outdoor shower, stargazing.', icon: '🌊', tag: 'Unwind' },
  { type: 'Treehouse Retreat', desc: 'Suspended in nature — off the grid, fully present.', icon: '🌳', tag: 'Adventurous' },
];

// ─── Shop Section ────────────────────────────────────────────────────────────
const SHOP_SECTIONS = [
  {
    category: 'Wellness & Massage',
    desc: 'Transform your space into a spa sanctuary',
    icon: '🕯️',
    items: [
      { name: 'Massage Candles Duo', note: 'Melt and pour — safe for skin', price: '$28' },
      { name: 'Essential Oil Set', note: 'Lavender, ylang ylang, sandalwood', price: '$35' },
      { name: 'Silk Eye Mask Set', note: 'For the full sensory experience', price: '$22' },
    ],
    cta: 'Shop Wellness',
    href: 'https://www.groupon.com/deals/spa',
  },
  {
    category: 'Lingerie & Loungewear',
    desc: 'Feel beautiful. Feel seen.',
    icon: '🌹',
    items: [
      { name: 'Silk Robe Set', note: 'His & hers matching sets', price: '$65' },
      { name: 'Lace Collection', note: 'Inclusive sizing S–4X', price: 'from $38' },
      { name: 'Loungewear Bundle', note: 'Soft and luxe, all day comfort', price: '$55' },
    ],
    cta: 'Shop Lingerie',
    href: 'https://www.groupon.com/deals/clothing-accessories',
  },
  {
    category: 'Hotel Deals',
    desc: 'Couples rates on top-rated romantic getaways',
    icon: '🏨',
    items: [
      { name: 'Weekend Escape Package', note: 'Spa + dinner + late checkout', price: 'from $129' },
      { name: 'City Boutique Hotel', note: 'Curated romantic properties', price: 'from $99' },
      { name: 'Cabin Getaway', note: 'Private, remote, unforgettable', price: 'from $149' },
    ],
    cta: 'Browse Hotel Deals',
    href: 'https://www.groupon.com/deals/travel',
  },
  {
    category: 'Dining & Experiences',
    desc: 'From intimate dinners to adventure days',
    icon: '🍽️',
    items: [
      { name: 'Private Chef Experience', note: 'For two, in your home', price: 'from $180' },
      { name: 'Couples Cooking Class', note: 'Cook together, eat together', price: 'from $85' },
      { name: 'Wine & Paint Night', note: 'Creative and fun', price: 'from $45' },
    ],
    cta: 'Browse Experiences',
    href: 'https://www.groupon.com/deals/restaurants',
  },
];

function DiceRoller() {
  const [result, setResult] = useState<(typeof DICE_THEMES)[0] | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    setRolling(true);
    setResult(null);
    setTimeout(() => {
      setResult(DICE_THEMES[Math.floor(Math.random() * DICE_THEMES.length)]);
      setRolling(false);
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-rose-500/20 p-5 text-center space-y-4"
      style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(139,92,246,0.06) 100%)' }}>
      <div className="flex items-center justify-center gap-2">
        <Shuffle className="w-5 h-5 text-rose-400" />
        <h3 className="text-white font-bold text-lg">Connection Dice</h3>
      </div>
      <p className="text-white/50 text-sm">Roll for tonight's theme — let the universe decide.</p>

      <Button onClick={roll} disabled={rolling}
        className="bg-gradient-to-r from-rose-600 to-violet-600 hover:opacity-90 text-white font-bold px-8 py-3 rounded-xl">
        {rolling ? '🎲 Rolling…' : '🎲 Roll Dice'}
      </Button>

      <AnimatePresence>
        {result && !rolling && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white/[0.05] border border-white/10 rounded-xl p-4">
            <div className="text-3xl mb-2">{result.emoji}</div>
            <p className="text-white font-bold text-base mb-1">{result.title}</p>
            <p className="text-white/60 text-sm">{result.desc}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-white/25 text-xs">8 themes — tap again for a new roll</p>
    </div>
  );
}

export default function HarmonyIntimacy() {
  const [openCat, setOpenCat] = useState<string | null>('Emotional');
  const [openHoliday, setOpenHoliday] = useState<string | null>(null);
  const [activeShop, setActiveShop] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0c0814 0%, #130d1f 50%, #0c1018 100%)' }}>

      {/* Header */}
      <div className="border-b border-white/[0.06] sticky top-0 z-10 backdrop-blur-xl" style={{ background: 'rgba(12,8,20,0.88)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/harmony-hub">
            <button className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Harmony
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <span className="text-white font-bold">Spark & Intimacy</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(139,92,246,0.12) 50%, rgba(20,184,166,0.08) 100%)' }}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
          <div className="text-5xl mb-3">🔥</div>
          <h1 className="text-white font-bold text-2xl mb-2">Keep the Spark Alive</h1>
          <p className="text-white/55 text-sm leading-relaxed max-w-md mx-auto">
            Healthy physical and emotional intimacy is a cornerstone of thriving relationships.
            This is your safe, private space to explore connection, romance, and joy together.
          </p>
        </div>

        {/* Ember's tip */}
        <div className="rounded-2xl border border-violet-500/20 p-4 flex gap-3"
          style={{ background: 'rgba(139,92,246,0.06)' }}>
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 text-xl">🌙</div>
          <div>
            <p className="text-violet-300 font-semibold text-sm">Ember says</p>
            <p className="text-white/60 text-sm leading-relaxed">
              "Intimacy isn't only physical — it's being truly seen. The couples who thrive are the ones who stay curious about each other."
            </p>
          </div>
        </div>

        {/* Connection Dice */}
        <DiceRoller />

        {/* 29 Ways to Connect */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="text-white font-bold text-lg">29 Ways to Connect</h2>
          </div>
          <div className="space-y-2">
            {CONNECTION_TYPES.map(cat => (
              <div key={cat.cat} className="rounded-2xl border border-white/[0.07] overflow-hidden">
                <button
                  onClick={() => setOpenCat(openCat === cat.cat ? null : cat.cat)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors">
                  <span className="text-white font-medium">{cat.cat} Intimacy</span>
                  {openCat === cat.cat ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                <AnimatePresence>
                  {openCat === cat.cat && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/[0.05]">
                      <div className="p-4 space-y-2">
                        {cat.items.map((item, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="text-rose-400 text-sm font-bold shrink-0 mt-0.5">{i + 1}.</span>
                            <p className="text-white/65 text-sm">{item}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Weekend Getaways */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-teal-400" />
            <h2 className="text-white font-bold text-lg">Weekend Escapes</h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {GETAWAY_IDEAS.map((g, i) => (
              <motion.a key={i} href="https://www.groupon.com/deals/travel" target="_blank" rel="noopener noreferrer"
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.07] p-4 hover:border-teal-500/30 transition-all group"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-3xl">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium text-sm">{g.type}</p>
                    <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full">{g.tag}</span>
                  </div>
                  <p className="text-white/50 text-xs">{g.desc}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors shrink-0" />
              </motion.a>
            ))}
          </div>
          <p className="text-white/25 text-xs text-center mt-3">Powered by Groupon · Couples rates available</p>
        </div>

        {/* Holiday Themes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">Holiday Themes</h2>
          </div>
          <div className="space-y-2">
            {HOLIDAY_THEMES.map(h => (
              <div key={h.holiday} className="rounded-2xl border border-white/[0.07] overflow-hidden">
                <button
                  onClick={() => setOpenHoliday(openHoliday === h.holiday ? null : h.holiday)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.03] transition-colors">
                  <span className="text-2xl">{h.emoji}</span>
                  <span className="text-white font-medium flex-1">{h.holiday}</span>
                  {openHoliday === h.holiday ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                <AnimatePresence>
                  {openHoliday === h.holiday && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-white/[0.05]">
                      <div className="p-4 space-y-2">
                        {h.ideas.map((idea, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="text-amber-400 text-sm font-bold shrink-0 mt-0.5">→</span>
                            <p className="text-white/65 text-sm">{idea}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Shop Together */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-pink-400" />
            <h2 className="text-white font-bold text-lg">Shop Together</h2>
            <span className="text-xs text-white/30 ml-1">Affiliate links — we earn a small commission</span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap mb-4">
            {SHOP_SECTIONS.map((s, i) => (
              <button key={i} onClick={() => setActiveShop(i)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeShop === i
                    ? 'border-pink-500/50 bg-pink-500/15 text-pink-300'
                    : 'border-white/10 bg-white/[0.03] text-white/40 hover:border-white/20'
                }`}>
                {s.icon} {s.category}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeShop} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-pink-500/15 p-5"
              style={{ background: 'rgba(244,63,94,0.04)' }}>
              <p className="text-white/50 text-sm mb-4">{SHOP_SECTIONS[activeShop].desc}</p>
              <div className="space-y-3 mb-4">
                {SHOP_SECTIONS[activeShop].items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-white/40 text-xs">{item.note}</p>
                    </div>
                    <span className="text-pink-300 text-sm font-bold">{item.price}</span>
                  </div>
                ))}
              </div>
              <a href={SHOP_SECTIONS[activeShop].href} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-90 text-white font-bold rounded-xl">
                  <Gift className="w-4 h-4 mr-2" />
                  {SHOP_SECTIONS[activeShop].cta}
                  <ExternalLink className="w-3.5 h-3.5 ml-2" />
                </Button>
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Influencer Spotlight placeholder */}
        <div className="rounded-2xl border border-white/[0.07] p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-white font-medium mb-1">Relationship Experts</p>
          <p className="text-white/40 text-sm">
            Influencer spotlights coming soon — intimacy coaches, sex educators, and relationship coaches sharing their best advice.
          </p>
        </div>

        {/* Safety note */}
        <div className="rounded-2xl border border-teal-500/15 p-4 flex gap-3"
          style={{ background: 'rgba(20,184,166,0.04)' }}>
          <span className="text-2xl shrink-0">🛡️</span>
          <div>
            <p className="text-teal-300 font-semibold text-sm mb-1">Consent & Safety First</p>
            <p className="text-white/50 text-xs leading-relaxed">
              All activities and suggestions here are built on the foundation of mutual enthusiasm and consent. 
              If anything ever feels uncomfortable, your voice matters. Healthy intimacy is always a yes — freely given by both people.
            </p>
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
