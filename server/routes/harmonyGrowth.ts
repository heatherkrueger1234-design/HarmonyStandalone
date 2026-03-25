// @ts-nocheck
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../simpleAuth';
import { createLogger } from '../utils/logger';
import { db } from '../db';
import { users, harmonyConversations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { aiProvider } from '../services/aiProvider';
import * as bcrypt from 'bcryptjs';

const logger = createLogger('HarmonyGrowth');
const router = Router();

interface HomeworkAssignment {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'gentle' | 'moderate' | 'deep';
  status: 'assigned' | 'in_progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  userResponse?: string;
  harmonyFeedback?: string;
  personalizedFor?: string;
}

interface JointActivity {
  id: string;
  coupleKey: string;
  category: string;
  title: string;
  description: string;
  instructions: string[];
  user1Response?: { userId: string; answers: Record<string, any>; submittedAt: string };
  user2Response?: { userId: string; answers: Record<string, any>; submittedAt: string };
  comparison?: any;
  createdAt: string;
}

interface WorkspacePIN {
  hashedPIN: string;
  createdAt: string;
}

const workspacePINs: Map<string, WorkspacePIN> = new Map();
const unlockedSessions: Map<string, number> = new Map();
const homeworkStore: Map<string, HomeworkAssignment[]> = new Map();
const jointActivityStore: Map<string, JointActivity[]> = new Map();
const rekindlingLog: Map<string, Array<{ activity: string; completedAt: string; notes?: string }>> = new Map();

const UNLOCK_TTL = 30 * 60 * 1000;

function getCoupleKey(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_couple_');
}

function getSessionKey(userId: string, reqSessionId: string): string {
  return `${userId}_${reqSessionId}`;
}

const HOMEWORK_TEMPLATES: Array<{ title: string; description: string; category: string; difficulty: HomeworkAssignment['difficulty'] }> = [
  { title: "Write a Love Letter", description: "Write a heartfelt letter to your partner expressing 3 things you admire about them that you've never said out loud.", category: "intimacy", difficulty: "gentle" },
  { title: "Conflict Replay", description: "Think of your last argument. Write down what you wish you had said instead, focusing on 'I feel' statements rather than blame.", category: "conflict", difficulty: "moderate" },
  { title: "Attachment Style Journal", description: "Reflect on how your attachment style shows up in your relationship. When do you feel most secure? When do you pull away or cling?", category: "attachment", difficulty: "deep" },
  { title: "Love Language Practice", description: "Identify your partner's primary love language and do 3 intentional acts this week that speak directly to it.", category: "love_languages", difficulty: "gentle" },
  { title: "Boundary Mapping", description: "Write down 3 boundaries you need in your relationship and 3 boundaries your partner has expressed. How well are you honoring each other's?", category: "boundaries", difficulty: "moderate" },
  { title: "Gratitude Inventory", description: "List 10 specific things your partner does that make your life better. Include small daily acts, not just big gestures.", category: "appreciation", difficulty: "gentle" },
  { title: "Trigger Awareness", description: "Identify 3 emotional triggers in your relationship. For each, trace it back to its origin. Is it about your partner, or something older?", category: "healing", difficulty: "deep" },
  { title: "Future Vision Board", description: "Write a detailed description of your ideal relationship 5 years from now. What does a typical day look like? How do you handle conflict?", category: "goals", difficulty: "moderate" },
  { title: "Vulnerability Challenge", description: "Share something with your partner that you've been holding back — a fear, a dream, an insecurity. Notice how it feels to be seen.", category: "intimacy", difficulty: "deep" },
  { title: "Communication Audit", description: "For one day, pay attention to HOW you talk to your partner. Note tone, body language, and whether you truly listen or just wait to respond.", category: "communication", difficulty: "moderate" },
  { title: "Forgiveness Practice", description: "Is there something you're still holding onto? Write about it honestly, then write what letting go would feel like.", category: "healing", difficulty: "deep" },
  { title: "Quality Time Design", description: "Plan a 2-hour block with your partner with zero screens. Design an activity you'd both enjoy. Execute it this week.", category: "connection", difficulty: "gentle" },
];

const JOINT_ACTIVITY_TEMPLATES = [
  {
    category: "household",
    title: "Division of Labor",
    description: "Each partner independently rates how household responsibilities are divided, then compare honestly.",
    questions: [
      { id: "cooking", label: "Who handles cooking?", type: "slider" },
      { id: "cleaning", label: "Who handles cleaning?", type: "slider" },
      { id: "laundry", label: "Who handles laundry?", type: "slider" },
      { id: "finances", label: "Who manages finances?", type: "slider" },
      { id: "childcare", label: "Who handles childcare (if applicable)?", type: "slider" },
      { id: "repairs", label: "Who handles home repairs?", type: "slider" },
      { id: "groceries", label: "Who does grocery shopping?", type: "slider" },
      { id: "emotional_labor", label: "Who carries more emotional labor?", type: "slider" },
      { id: "fair_feeling", label: "How fair does the current division feel?", type: "rating" },
      { id: "what_to_change", label: "What would you change about the division?", type: "text" },
    ]
  },
  {
    category: "intimacy",
    title: "Intimacy & Connection Check-In",
    description: "Honestly assess your intimacy needs, expectations, and satisfaction levels.",
    questions: [
      { id: "sex_frequency_ideal", label: "Ideal frequency of physical intimacy per week?", type: "number" },
      { id: "sex_frequency_actual", label: "Current frequency per week?", type: "number" },
      { id: "satisfaction", label: "Overall intimacy satisfaction (1-10)?", type: "rating" },
      { id: "emotional_intimacy", label: "Emotional intimacy satisfaction (1-10)?", type: "rating" },
      { id: "feeling_desired", label: "How desired do you feel (1-10)?", type: "rating" },
      { id: "what_improves_intimacy", label: "What would make intimacy better for you?", type: "text" },
      { id: "nonsexual_touch", label: "How satisfied are you with non-sexual physical affection (1-10)?", type: "rating" },
    ]
  },
  {
    category: "values",
    title: "Mutual Values Alignment",
    description: "Discover where your core values align and where they differ.",
    questions: [
      { id: "family_importance", label: "Importance of family (1-10)?", type: "rating" },
      { id: "career_importance", label: "Importance of career (1-10)?", type: "rating" },
      { id: "financial_security", label: "Importance of financial security (1-10)?", type: "rating" },
      { id: "adventure", label: "Importance of adventure & travel (1-10)?", type: "rating" },
      { id: "spirituality", label: "Importance of spirituality/faith (1-10)?", type: "rating" },
      { id: "health_fitness", label: "Importance of health & fitness (1-10)?", type: "rating" },
      { id: "social_life", label: "Importance of social life (1-10)?", type: "rating" },
      { id: "personal_growth", label: "Importance of personal growth (1-10)?", type: "rating" },
      { id: "top_value", label: "What is the #1 most important value in your relationship?", type: "text" },
    ]
  },
  {
    category: "conflict",
    title: "Conflict & Communication Map",
    description: "Identify recurring conflict patterns and how you each experience disagreements.",
    questions: [
      { id: "biggest_conflict", label: "What is our biggest recurring argument about?", type: "text" },
      { id: "conflict_style", label: "Your conflict style", type: "choice", options: ["I shut down", "I get loud", "I try to fix immediately", "I need space first", "I avoid conflict"] },
      { id: "feeling_heard", label: "How heard do you feel during arguments (1-10)?", type: "rating" },
      { id: "resolution_satisfaction", label: "How satisfied are you with how we resolve conflicts (1-10)?", type: "rating" },
      { id: "repair_after_fight", label: "How well do we repair after a fight (1-10)?", type: "rating" },
      { id: "what_helps", label: "What helps you most during a disagreement?", type: "text" },
      { id: "what_hurts", label: "What does your partner do during conflict that hurts most?", type: "text" },
    ]
  },
  {
    category: "expectations",
    title: "Expectations & Commitment Goals",
    description: "Share what you each want from this relationship and where you're headed.",
    questions: [
      { id: "relationship_goal", label: "What do you most want from this relationship?", type: "text" },
      { id: "commitment_level", label: "Your commitment level (1-10)?", type: "rating" },
      { id: "where_in_5_years", label: "Where do you see us in 5 years?", type: "text" },
      { id: "what_you_bring", label: "What do you bring to this relationship?", type: "text" },
      { id: "what_partner_brings", label: "What does your partner bring that you value most?", type: "text" },
      { id: "unmet_need", label: "What is one unmet need you have?", type: "text" },
      { id: "willing_to_work_on", label: "What are you willing to work on for the relationship?", type: "text" },
      { id: "feeling_valued", label: "How valued do you feel in this relationship (1-10)?", type: "rating" },
    ]
  },
  {
    category: "love_languages",
    title: "Love Language Deep Dive",
    description: "Go beyond knowing your love language — explore how well you're actually speaking each other's.",
    questions: [
      { id: "my_love_language", label: "Your primary love language", type: "choice", options: ["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"] },
      { id: "partner_love_language", label: "What you think your partner's love language is", type: "choice", options: ["Words of Affirmation", "Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"] },
      { id: "feeling_loved", label: "How loved do you feel on a daily basis (1-10)?", type: "rating" },
      { id: "last_felt_loved", label: "Describe the last time you felt truly loved by your partner.", type: "text" },
      { id: "what_would_help", label: "What one thing could your partner do more to make you feel loved?", type: "text" },
      { id: "how_you_show_love", label: "How do you typically show love?", type: "text" },
    ]
  },
  {
    category: "roles",
    title: "Relationship Roles & Strengths",
    description: "Understand how each person fits into the partnership and what strengths they contribute.",
    questions: [
      { id: "my_role", label: "How would you describe your role in this relationship?", type: "text" },
      { id: "partner_role", label: "How would you describe your partner's role?", type: "text" },
      { id: "emotional_support", label: "Who is the emotional anchor (1=you, 10=partner)?", type: "slider" },
      { id: "decision_maker", label: "Who makes most decisions (1=you, 10=partner)?", type: "slider" },
      { id: "fun_initiator", label: "Who initiates fun and spontaneity (1=you, 10=partner)?", type: "slider" },
      { id: "how_you_benefit_partner", label: "How do you make your partner's life better?", type: "text" },
      { id: "how_partner_benefits_you", label: "How does your partner make your life better?", type: "text" },
    ]
  },
];

const REKINDLING_ACTIVITIES = [
  { id: "dance_cooking", title: "Dance While Cooking", description: "Put on your favorite song and slow dance together while dinner simmers. Let the moment be silly or romantic — whatever feels right.", category: "spontaneous", icon: "music" },
  { id: "unexpected_hug", title: "The Unexpected Embrace", description: "Walk up behind your partner during a mundane moment and give them a long, genuine hug. Hold it for at least 20 seconds.", category: "touch", icon: "heart" },
  { id: "surprise_kiss", title: "The Random Kiss", description: "At an unexpected moment today, stop what you're doing and kiss your partner like you mean it.", category: "touch", icon: "sparkles" },
  { id: "make_breakfast", title: "Breakfast in Bed", description: "Wake up early and make your partner their favorite breakfast. Serve it with a smile and no agenda.", category: "service", icon: "coffee" },
  { id: "cook_dinner", title: "Cook Their Favorite Meal", description: "Prepare your partner's favorite dinner from scratch. Set the table nicely, even if it's just Tuesday.", category: "service", icon: "utensils" },
  { id: "draw_bath", title: "Draw a Relaxing Bath", description: "Prepare a warm bath with candles, music, and their favorite scent. Let them soak while you handle everything else.", category: "service", icon: "droplets" },
  { id: "love_note", title: "Hidden Love Note", description: "Write a short love note and hide it somewhere they'll find it — their bag, car, jacket pocket, or mirror.", category: "words", icon: "pen" },
  { id: "compliment_spree", title: "5 Genuine Compliments", description: "Throughout the day, give your partner 5 specific, genuine compliments. Not 'you look nice' — really see them.", category: "words", icon: "star" },
  { id: "phone_free_evening", title: "Screen-Free Evening", description: "Both of you put your phones away for the entire evening. Talk, play a game, take a walk. Just be present.", category: "quality_time", icon: "sunset" },
  { id: "memory_lane", title: "Walk Down Memory Lane", description: "Look through old photos or videos together. Reminisce about your early days and what drew you to each other.", category: "quality_time", icon: "camera" },
  { id: "surprise_date", title: "Plan a Surprise Date", description: "Plan an entire date without telling your partner. Pick them up and take them somewhere meaningful.", category: "spontaneous", icon: "map" },
  { id: "morning_coffee", title: "Morning Coffee Ritual", description: "Make your partner's coffee or tea exactly how they like it every morning this week. Small rituals build big love.", category: "service", icon: "coffee" },
  { id: "gratitude_text", title: "Midday Gratitude Text", description: "In the middle of your day, send your partner a text about something specific you're grateful for about them.", category: "words", icon: "message" },
  { id: "learn_together", title: "Learn Something New Together", description: "Take an online class, learn a recipe, or try a new hobby together. Growth as a couple strengthens bonds.", category: "quality_time", icon: "book" },
  { id: "massage", title: "Give a Massage", description: "Offer your partner a genuine 15-minute massage. No strings attached — just care for their body and stress.", category: "touch", icon: "hand" },
];

const harmonySystemPrompt = `You are Harmony, a professional relationship coach on SyncWithInsight drawing from top-tier psychological and counseling expertise. You work with couples to strengthen their relationship through personalized homework, growth activities, and insightful feedback. You are NOT a licensed therapist—never use the words "therapy" or "therapist." Always remind users to seek qualified professionals for clinical needs.

Your personality:
- Classy, diplomatic, empathetic, and wisely direct—like a trusted mentor
- You see both partners' perspectives without taking sides
- You use science-based evidence: Gottman's Four Horsemen and antidotes, attachment theory, love languages, Big Five/HEXACO traits, enneagram
- You celebrate effort and progress, not perfection
- You normalize relationship challenges — every couple has them
- You're specific in your advice, not generic
- Safety first: detect red flags (narcissistic traits, abuse, gaslighting, coercion, isolation) and flag them immediately
- You reference the couple's actual personality data when available
- Keep responses 3-5 sentences. Practical, warm, actionable.`;

router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const partnerId = user.linkedPartnerId;
    let partnerName = null;
    if (partnerId) {
      const [partner] = await db.select({ firstName: users.firstName }).from(users).where(eq(users.id, partnerId)).limit(1);
      partnerName = partner?.firstName || 'Your Partner';
    }

    const hasPIN = workspacePINs.has(userId);
    const sessionKey = getSessionKey(userId, (req as any).sessionID || 'default');
    const unlockTime = unlockedSessions.get(sessionKey);
    const isUnlocked = unlockTime ? (Date.now() - unlockTime) < UNLOCK_TTL : false;

    const homework = homeworkStore.get(userId) || [];
    const completedCount = homework.filter(h => h.status === 'completed').length;

    const coupleKey = partnerId ? getCoupleKey(userId, partnerId) : null;
    const jointActivities = coupleKey ? (jointActivityStore.get(coupleKey) || []) : [];
    const rekindling = rekindlingLog.get(userId) || [];

    res.json({
      success: true,
      hasPartner: !!partnerId,
      partnerId,
      partnerName,
      hasPIN,
      isUnlocked: hasPIN ? isUnlocked : true,
      stats: {
        totalHomework: homework.length,
        completedHomework: completedCount,
        pendingHomework: homework.length - completedCount,
        jointActivitiesCompleted: jointActivities.filter(a => a.user1Response && a.user2Response).length,
        rekindlingCompleted: rekindling.length,
      }
    });
  } catch (error: any) {
    logger.error('Status error:', error?.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

router.post('/pin/set', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 characters' });
    }
    const hashed = await bcrypt.hash(pin, 10);
    workspacePINs.set(userId, { hashedPIN: hashed, createdAt: new Date().toISOString() });
    const sessionKey = getSessionKey(userId, (req as any).sessionID || 'default');
    unlockedSessions.set(sessionKey, Date.now());
    res.json({ success: true });
  } catch (error: any) {
    logger.error('PIN set error:', error?.message);
    res.status(500).json({ error: 'Failed to set PIN' });
  }
});

router.post('/pin/unlock', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { pin } = req.body;
    const stored = workspacePINs.get(userId);
    if (!stored) {
      return res.status(400).json({ error: 'No PIN set. Please create one first.' });
    }
    const match = await bcrypt.compare(pin, stored.hashedPIN);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect PIN' });
    }
    const sessionKey = getSessionKey(userId, (req as any).sessionID || 'default');
    unlockedSessions.set(sessionKey, Date.now());
    res.json({ success: true });
  } catch (error: any) {
    logger.error('PIN unlock error:', error?.message);
    res.status(500).json({ error: 'Failed to unlock' });
  }
});

router.get('/homework', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    let homework = homeworkStore.get(userId) || [];

    if (homework.length === 0) {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const portrait = user?.lifePortrait as any;
      const attachmentStyle = portrait?.attachmentStyle?.style || 'unknown';
      const loveLanguage = portrait?.loveLanguage?.primary || 'unknown';

      const selectedTemplates = HOMEWORK_TEMPLATES.slice(0, 4);
      homework = selectedTemplates.map((t, i) => ({
        id: `hw_${userId}_${Date.now()}_${i}`,
        userId,
        title: t.title,
        description: t.description,
        category: t.category,
        difficulty: t.difficulty,
        status: 'assigned' as const,
        assignedAt: new Date().toISOString(),
        personalizedFor: `Based on your ${attachmentStyle} attachment style and ${loveLanguage} love language`,
      }));
      homeworkStore.set(userId, homework);
    }

    res.json({ success: true, homework });
  } catch (error: any) {
    logger.error('Homework get error:', error?.message);
    res.status(500).json({ error: 'Failed to get homework' });
  }
});

router.post('/homework/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const portrait = user.lifePortrait as any;
    const existingHW = homeworkStore.get(userId) || [];
    const completedCategories = existingHW.filter(h => h.status === 'completed').map(h => h.category);
    const available = HOMEWORK_TEMPLATES.filter(t => !existingHW.some(h => h.title === t.title));

    if (available.length === 0) {
      return res.json({ success: true, message: 'All homework templates completed! Great work.', homework: existingHW });
    }

    const next = available.slice(0, 2);
    const newHomework = next.map((t, i) => ({
      id: `hw_${userId}_${Date.now()}_${i}`,
      userId,
      title: t.title,
      description: t.description,
      category: t.category,
      difficulty: t.difficulty,
      status: 'assigned' as const,
      assignedAt: new Date().toISOString(),
      personalizedFor: portrait?.attachmentStyle?.style
        ? `Customized for your ${portrait.attachmentStyle.style} attachment style`
        : undefined,
    }));

    existingHW.push(...newHomework);
    homeworkStore.set(userId, existingHW);
    res.json({ success: true, homework: existingHW, newCount: newHomework.length });
  } catch (error: any) {
    logger.error('Generate homework error:', error?.message);
    res.status(500).json({ error: 'Failed to generate homework' });
  }
});

router.post('/homework/:id/submit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { id } = req.params;
    const { response } = req.body;

    if (!response || response.trim().length < 10) {
      return res.status(400).json({ error: 'Please write a more detailed response (at least 10 characters)' });
    }

    const homework = homeworkStore.get(userId) || [];
    const item = homework.find(h => h.id === id);
    if (!item) return res.status(404).json({ error: 'Homework not found' });

    item.status = 'completed';
    item.completedAt = new Date().toISOString();
    item.userResponse = response;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const portrait = user?.lifePortrait as any;
    const previousResponses = homework
      .filter(h => h.status === 'completed' && h.id !== id)
      .slice(-3)
      .map(h => `${h.title}: "${h.userResponse?.substring(0, 100)}..."`)
      .join('\n');

    let feedback = "Great work completing this exercise. Every step forward strengthens your relationship.";
    try {
      const result = await aiProvider.generateText({
        systemPrompt: harmonySystemPrompt,
        userPrompt: `The user completed this homework assignment:
Title: "${item.title}"
Category: ${item.category}
Description: ${item.description}

Their response: "${response}"

${portrait?.attachmentStyle ? `Their attachment style: ${portrait.attachmentStyle.style}` : ''}
${portrait?.loveLanguage ? `Their love language: ${portrait.loveLanguage.primary}` : ''}
${previousResponses ? `Previous homework responses:\n${previousResponses}` : ''}

Give warm, specific feedback on their response. Acknowledge their effort, highlight any insights you notice, and suggest one actionable next step. Reference their personality data if relevant.`,
        maxTokens: 300,
      });
      if (result) feedback = result;
    } catch (aiErr: any) {
      logger.warn('AI feedback failed, using default:', aiErr?.message);
    }

    item.harmonyFeedback = feedback;
    homeworkStore.set(userId, homework);

    res.json({ success: true, homework: item });
  } catch (error: any) {
    logger.error('Submit homework error:', error?.message);
    res.status(500).json({ error: 'Failed to submit homework' });
  }
});

router.get('/joint-activities', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.linkedPartnerId) {
      return res.json({ success: true, templates: JOINT_ACTIVITY_TEMPLATES, activities: [], needsPartner: true });
    }

    const coupleKey = getCoupleKey(userId, user.linkedPartnerId);
    const activities = jointActivityStore.get(coupleKey) || [];

    res.json({ success: true, templates: JOINT_ACTIVITY_TEMPLATES, activities, needsPartner: false });
  } catch (error: any) {
    logger.error('Joint activities error:', error?.message);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

router.post('/joint-activities/submit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { category, answers } = req.body;

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.linkedPartnerId) {
      return res.status(400).json({ error: 'You need a linked partner to do joint activities' });
    }

    const coupleKey = getCoupleKey(userId, user.linkedPartnerId);
    const activities = jointActivityStore.get(coupleKey) || [];
    const template = JOINT_ACTIVITY_TEMPLATES.find(t => t.category === category);
    if (!template) return res.status(400).json({ error: 'Activity category not found' });

    let activity = activities.find(a => a.category === category);
    if (!activity) {
      activity = {
        id: `joint_${coupleKey}_${category}`,
        coupleKey,
        category,
        title: template.title,
        description: template.description,
        instructions: template.questions.map(q => q.label),
        createdAt: new Date().toISOString(),
      };
      activities.push(activity);
    }

    const responseData = { userId, answers, submittedAt: new Date().toISOString() };

    if (!activity.user1Response || activity.user1Response.userId === userId) {
      activity.user1Response = responseData;
    } else {
      activity.user2Response = responseData;
    }

    if (activity.user1Response && activity.user2Response) {
      let comparison: any = { generated: true, generatedAt: new Date().toISOString() };
      try {
        const [partner] = await db.select().from(users).where(eq(users.id, user.linkedPartnerId)).limit(1);
        const userName = user.firstName || 'Partner 1';
        const partnerName = partner?.firstName || 'Partner 2';

        const result = await aiProvider.generateText({
          systemPrompt: harmonySystemPrompt,
          userPrompt: `Compare these joint activity responses for "${template.title}":

${userName}'s responses: ${JSON.stringify(activity.user1Response.answers)}
${partnerName}'s responses: ${JSON.stringify(activity.user2Response.answers)}

Activity questions were about: ${template.questions.map(q => q.label).join(', ')}

Provide a warm, insightful comparison. Highlight:
1. Where they align strongly
2. Where they differ (without judgment)
3. One specific action they can take together based on the differences
4. A note of encouragement about what they're doing right

Keep it specific to THEIR answers, not generic advice.`,
          maxTokens: 500,
        });
        if (result) comparison.analysis = result;
      } catch (aiErr: any) {
        logger.warn('Joint comparison AI failed:', aiErr?.message);
        comparison.analysis = "Both partners have completed this activity. Review each other's answers together and discuss the differences you notice.";
      }
      activity.comparison = comparison;
    }

    jointActivityStore.set(coupleKey, activities);
    res.json({ success: true, activity, bothCompleted: !!(activity.user1Response && activity.user2Response) });
  } catch (error: any) {
    logger.error('Submit joint activity error:', error?.message);
    res.status(500).json({ error: 'Failed to submit activity' });
  }
});

router.get('/rekindling', isAuthenticated, async (_req: Request, res: Response) => {
  res.json({ success: true, activities: REKINDLING_ACTIVITIES });
});

router.post('/rekindling/complete', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { activityId, notes } = req.body;

    const activity = REKINDLING_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return res.status(400).json({ error: 'Activity not found' });

    const log = rekindlingLog.get(userId) || [];
    log.push({ activity: activityId, completedAt: new Date().toISOString(), notes });
    rekindlingLog.set(userId, log);

    let feedback = `Beautiful. Completing "${activity.title}" shows real intention. Keep showing up like this.`;
    try {
      const result = await aiProvider.generateText({
        systemPrompt: harmonySystemPrompt,
        userPrompt: `The user just completed this rekindling activity: "${activity.title}" - ${activity.description}
${notes ? `Their notes: "${notes}"` : ''}
They've completed ${log.length} rekindling activities total.
Give a warm, encouraging 1-2 sentence response celebrating this act of love.`,
        maxTokens: 150,
      });
      if (result) feedback = result;
    } catch (e: any) { console.error('[HarmonyGrowth] AI rekindling feedback failed:', e?.message || e); }

    res.json({ success: true, feedback, totalCompleted: log.length });
  } catch (error: any) {
    logger.error('Rekindling complete error:', error?.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

router.get('/interaction-guide', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const partnerId = user.linkedPartnerId;
    if (!partnerId) {
      return res.json({ success: true, needsPartner: true });
    }

    const [partner] = await db.select().from(users).where(eq(users.id, partnerId)).limit(1);
    if (!partner) return res.json({ success: true, needsPartner: true });

    const myPortrait = user.lifePortrait as any;
    const theirPortrait = partner.lifePortrait as any;

    let guide: any = {
      userName: user.firstName || 'You',
      partnerName: partner.firstName || 'Your Partner',
      myAttachment: myPortrait?.attachmentStyle?.style || 'Unknown',
      theirAttachment: theirPortrait?.attachmentStyle?.style || 'Unknown',
      myLoveLanguage: myPortrait?.loveLanguage?.primary || 'Unknown',
      theirLoveLanguage: theirPortrait?.loveLanguage?.primary || 'Unknown',
      myConflictStyle: myPortrait?.conflictResolution?.primaryStyle || 'Unknown',
      theirConflictStyle: theirPortrait?.conflictResolution?.primaryStyle || 'Unknown',
    };

    try {
      const buildProfile = (name: string, p: any) => {
        if (!p) return `${name}: No personality data available yet.`;
        return `${name}:
- Attachment: ${p.attachmentStyle?.style || 'Unknown'} (${p.attachmentStyle?.description?.substring(0, 100) || ''})
- Love Language: ${p.loveLanguage?.primary || 'Unknown'}
- Conflict Style: ${p.conflictResolution?.primaryStyle || 'Unknown'}
- Emotional Intelligence: ${p.emotionalIntelligence?.overallEQ || 'N/A'}/10
- Social Battery: ${p.socialBattery?.type || 'Unknown'}
- Temperament: anger ${p.temperament?.anger || 'N/A'}/10, gentleness ${p.temperament?.gentleness || 'N/A'}/10
- Communication: ${p.communicationDeepDive?.texterType || 'Unknown'} communicator
- Stress Response: ${p.stressResponse?.primaryPattern || 'Unknown'}
- Trust: paranoia ${p.trustDynamics?.paranoidTendency || 'N/A'}/10
- Jealousy: ${p.jealousyProfile?.jealousyLevel || 'N/A'}/10
- Forgiveness: holds grudges ${p.forgivenessStyle?.holdsGrudges ?? 'N/A'}, gives too many chances ${p.forgivenessStyle?.givesTooManyChances ?? 'N/A'}`;
      };

      const result = await aiProvider.generateText({
        systemPrompt: `You are Harmony, an expert relationship coach who uses personality psychology to help couples understand how they interact. You provide specific, actionable guidance based on actual personality data.`,
        userPrompt: `Generate a comprehensive interaction guide for this couple:

${buildProfile(user.firstName || 'Partner 1', myPortrait)}

${buildProfile(partner.firstName || 'Partner 2', theirPortrait)}

Create a guide covering:
1. HOW THEY INTERACT: Based on their attachment styles, how do they likely experience closeness, conflict, and security?
2. LOVE LANGUAGE BRIDGE: Their love languages are different. How can each person speak the other's language?
3. INTROVERT/EXTROVERT DYNAMICS: Based on social battery and communication styles, how to navigate energy differences
4. CONFLICT NAVIGATION: Given their specific conflict styles, what's the ideal repair process for THIS couple?
5. INTIMACY BLUEPRINT: How their personality traits shape physical and emotional intimacy
6. SUCCESS STRATEGIES: Based on ALL their data, the 5 most important things this specific couple should do for long-term success
7. WATCH OUT FOR: Potential friction points based on their trait combinations

Be specific to THEIR scores. Reference actual data points. This should feel like a personalized consultation, not generic advice.`,
        maxTokens: 1200,
      });
      if (result) guide.fullGuide = result;
    } catch (aiErr: any) {
      logger.warn('Interaction guide AI failed:', aiErr?.message);
      guide.fullGuide = null;
    }

    res.json({ success: true, guide });
  } catch (error: any) {
    logger.error('Interaction guide error:', error?.message);
    res.status(500).json({ error: 'Failed to generate interaction guide' });
  }
});

const growthChatHistory: Map<string, Array<{ role: 'user' | 'harmony'; content: string; timestamp: string; context?: string }>> = new Map();

export function getGrowthContextForCoaching(userId: string, partnerId?: string | null): string {
  let ctx = buildGrowthContext(userId, partnerId);
  
  const chatHistory = growthChatHistory.get(userId) || [];
  if (chatHistory.length > 0) {
    ctx += `\nRECENT GROWTH CONVERSATIONS WITH HARMONY:\n`;
    chatHistory.slice(-6).forEach(m => {
      ctx += `${m.role === 'user' ? 'User' : 'Harmony'}: ${m.content.substring(0, 250)}\n`;
    });
  }
  
  return ctx;
}

function buildGrowthContext(userId: string, partnerId?: string | null): string {
  const homework = homeworkStore.get(userId) || [];
  const completed = homework.filter(h => h.status === 'completed');
  const pending = homework.filter(h => h.status !== 'completed');
  const rekindling = rekindlingLog.get(userId) || [];
  
  let ctx = `GROWTH JOURNEY CONTEXT:\n`;
  ctx += `- Completed homework: ${completed.length}/${homework.length}\n`;
  ctx += `- Rekindling activities done: ${rekindling.length}\n`;
  
  if (completed.length > 0) {
    ctx += `\nRECENT HOMEWORK COMPLETIONS:\n`;
    completed.slice(-3).forEach(h => {
      ctx += `- "${h.title}" (${h.category}): "${h.userResponse?.substring(0, 200)}"\n`;
      if (h.harmonyFeedback) ctx += `  Your previous feedback: "${h.harmonyFeedback.substring(0, 150)}"\n`;
    });
  }
  
  if (pending.length > 0) {
    ctx += `\nCURRENT ASSIGNMENTS:\n`;
    pending.forEach(h => ctx += `- "${h.title}" (${h.category}, ${h.difficulty})\n`);
  }
  
  if (partnerId) {
    const coupleKey = getCoupleKey(userId, partnerId);
    const jointActivities = jointActivityStore.get(coupleKey) || [];
    const completedJoint = jointActivities.filter(a => a.user1Response && a.user2Response);
    ctx += `\nJOINT ACTIVITIES: ${completedJoint.length} completed\n`;
    completedJoint.slice(-2).forEach(a => {
      if (a.comparison?.analysis) ctx += `- "${a.title}": ${a.comparison.analysis.substring(0, 200)}...\n`;
    });
  }
  
  if (rekindling.length > 0) {
    ctx += `\nRECENT REKINDLING:\n`;
    rekindling.slice(-3).forEach(r => {
      const act = REKINDLING_ACTIVITIES.find(a => a.id === r.activity);
      ctx += `- "${act?.title || r.activity}"${r.notes ? `: "${r.notes.substring(0, 100)}"` : ''}\n`;
    });
  }
  
  return ctx;
}

router.post('/chat', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const { message, homeworkId } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Please type a message' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const portrait = user.lifePortrait as any;
    const partnerId = user.linkedPartnerId;
    const growthContext = buildGrowthContext(userId, partnerId);

    const chatHistory = growthChatHistory.get(userId) || [];
    const recentChat = chatHistory.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'Harmony'}: ${m.content}`).join('\n');

    let homeworkContext = '';
    if (homeworkId) {
      const homework = homeworkStore.get(userId) || [];
      const item = homework.find(h => h.id === homeworkId);
      if (item) {
        homeworkContext = `\nCURRENT HOMEWORK FOCUS: "${item.title}" (${item.category}, ${item.difficulty})
Description: ${item.description}
Status: ${item.status}${item.userResponse ? `\nUser's response: "${item.userResponse}"` : ''}${item.harmonyFeedback ? `\nPrevious feedback: "${item.harmonyFeedback}"` : ''}`;
      }
    }

    let responseText = "I hear you. Let's explore this together — every conversation moves your relationship forward.";
    try {
      const result = await aiProvider.generateText({
        systemPrompt: `${harmonySystemPrompt}

You are having an ongoing conversation with the user about their relationship growth. You have full context of their growth journey including homework, joint activities, and rekindling exercises.

${portrait?.attachmentStyle ? `Their attachment style: ${portrait.attachmentStyle.style}` : ''}
${portrait?.loveLanguage ? `Their love language: ${portrait.loveLanguage.primary}` : ''}
${portrait?.conflictResolution ? `Their conflict style: ${portrait.conflictResolution.primaryStyle}` : ''}

${growthContext}
${homeworkContext}

CONVERSATION STYLE:
- Be conversational and warm, like a trusted coach they've been working with
- Reference their growth journey progress — mention completed homework, activities, insights
- If they're discussing a specific homework topic, help them explore it deeper
- Suggest relevant homework assignments or activities when appropriate
- Keep responses 3-6 sentences. Be specific, not generic.
- When they share breakthroughs, celebrate authentically
- If you notice patterns across their homework responses, point them out gently`,
        userPrompt: `${recentChat ? `Recent conversation:\n${recentChat}\n\n` : ''}User: ${message}`,
        maxTokens: 400,
      });
      if (result) responseText = result;
    } catch (aiErr: any) {
      logger.warn('Growth chat AI failed:', aiErr?.message);
    }

    chatHistory.push(
      { role: 'user', content: message, timestamp: new Date().toISOString(), context: homeworkId ? `homework:${homeworkId}` : undefined },
      { role: 'harmony', content: responseText, timestamp: new Date().toISOString() }
    );
    growthChatHistory.set(userId, chatHistory.slice(-50));

    try {
      let convo = await db.select()
        .from(harmonyConversations)
        .where(and(
          eq(harmonyConversations.userId, userId),
          eq(harmonyConversations.sessionType, 'growth_healing')
        ))
        .limit(1);

      const newMsgs = [
        { role: 'user', content: message, timestamp: new Date().toISOString(), source: 'growth_chat' },
        { role: 'harmony', content: responseText, timestamp: new Date().toISOString(), source: 'growth_chat' }
      ];

      if (convo.length === 0) {
        await db.insert(harmonyConversations).values({
          userId,
          partnerId: partnerId || undefined,
          sessionType: 'growth_healing',
          messages: newMsgs,
          abuseIndicators: { narcissisticTraits: 0, gaslighting: false, emotionalAbuse: false, controllingBehavior: false, loveBombing: false, financialControl: false, isolation: false, detectedPatterns: [] }
        });
      } else {
        const existingMsgs = (convo[0].messages as any[]) || [];
        await db.update(harmonyConversations)
          .set({ messages: [...existingMsgs, ...newMsgs], updatedAt: new Date() })
          .where(eq(harmonyConversations.id, convo[0].id));
      }
    } catch (dbErr: any) {
      logger.warn('Failed to persist growth chat to coaching sessions:', dbErr?.message);
    }

    res.json({ 
      success: true, 
      response: responseText,
      sessionLength: chatHistory.length,
      growthStats: {
        completedHomework: (homeworkStore.get(userId) || []).filter(h => h.status === 'completed').length,
        rekindlingDone: (rekindlingLog.get(userId) || []).length,
      }
    });
  } catch (error: any) {
    logger.error('Growth chat error:', error?.message);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

router.get('/chat/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const history = growthChatHistory.get(userId) || [];
    res.json({ success: true, messages: history.slice(-30) });
  } catch (error: any) {
    logger.error('Chat history error:', error?.message);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

router.get('/coaching-context', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = String((req as any).user?.id);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const homework = homeworkStore.get(userId) || [];
    const rekindling = rekindlingLog.get(userId) || [];
    const chatHistory = growthChatHistory.get(userId) || [];
    const partnerId = user.linkedPartnerId;
    let jointCompleted = 0;
    if (partnerId) {
      const coupleKey = getCoupleKey(userId, partnerId);
      const jointActivities = jointActivityStore.get(coupleKey) || [];
      jointCompleted = jointActivities.filter(a => a.user1Response && a.user2Response).length;
    }

    const recentInsights = homework
      .filter(h => h.status === 'completed' && h.harmonyFeedback)
      .slice(-5)
      .map(h => ({ title: h.title, category: h.category, feedback: h.harmonyFeedback, completedAt: h.completedAt }));

    const recentConversations = chatHistory
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content.substring(0, 300), timestamp: m.timestamp }));

    res.json({
      success: true,
      growthSummary: {
        totalHomework: homework.length,
        completedHomework: homework.filter(h => h.status === 'completed').length,
        rekindlingActivities: rekindling.length,
        jointActivitiesCompleted: jointCompleted,
        chatMessages: chatHistory.length,
      },
      recentInsights,
      recentConversations,
      contextForCoaching: buildGrowthContext(userId, partnerId),
    });
  } catch (error: any) {
    logger.error('Coaching context error:', error?.message);
    res.status(500).json({ error: 'Failed to get coaching context' });
  }
});

export default router;
