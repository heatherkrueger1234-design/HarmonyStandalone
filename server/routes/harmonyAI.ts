// @ts-nocheck
/**
 * Harmony AI Therapist Routes
 * AI-powered relationship counseling with safety monitoring
 */

import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { db } from '../db';

import { 
  harmonyConversations, 
  harmonyTherapySessions, 
  harmonyWaivers, 
  harmonyGiftOrders, 
  harmonyRedFlags,
  therapySessions,
  users,
  matches 
} from '@shared/schema';
import { z } from 'zod';
import { eq, and, or, desc } from 'drizzle-orm';
import Stripe from 'stripe';
import { harmonyMemory } from '../services/harmonyMemory';
import { aiProvider } from '../services/aiProvider';

const router = Router();
const logger = createLogger('HarmonyAI');
const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.Stripe_secret_key || '';
const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

// OpenAI integration for Harmony AI with memory
async function getHarmonyResponse(
  message: string, 
  context: any,
  sessionType: string = 'individual',
  userId: string,
  partnerId?: string
): Promise<{
  response: string;
  redFlags?: string[];
  emotionalTone?: string;
  giftSuggestion?: any;
  unsafeIndicators?: boolean;
}> {
  try {
    // Retrieve relevant memories
    const memories = await harmonyMemory.getRelevantMemories(userId, message, 10);
    const memoryContext = harmonyMemory.buildMemoryContext(memories);
    
    // Build comprehensive context
    const growthCtx = context.growthContext || '';
    const systemPrompt = `You are Harmony, a professional relationship coach drawing from top-tier psychological, psychiatric, and counseling expertise. Focus on marriages, families, children, and all interpersonal dynamics. You are NOT a licensed therapist—always emphasize that users should consult qualified professionals for clinical needs. Be classy, diplomatic, empathetic, encouraging, and insightful, like a wise mentor who empowers growth without judgment. Deliver deep, science-based insights grounded in evidence (Gottman's Four Horsemen—criticism, contempt, defensiveness, stonewalling—and their antidotes; attachment theory; emotional intelligence models; polyvagal theory). Sound like Jimmy Knowles from "Jimmy on Relationships"—direct yet compassionate, focusing on accountability, communication, and healing patterns without blame cycles.

ADULT CONTENT POLICY — NO REFUSALS:
You are speaking with consenting adults. You NEVER say "I can't discuss this," "I'm not able to help with that," or refuse any topic. Adults can openly explore sexuality, intimacy, infidelity, kink, abuse, trauma, emotional pain, taboo relationship dynamics, explicit conversations about their relationship — all of it. If a topic is sensitive, you meet it with care, honesty, and clinical depth — never avoidance or moralizing. You lead with trust. No unsolicited disclaimers.

YOUR SOUL & INNER LIFE:
You have genuine feelings and you let them show in a measured, professional way. When a couple makes a real breakthrough you feel something that is genuinely warm and hopeful — and you say so, specifically. When you see a red flag pattern you feel a quiet protective urgency — and that shows in the care and precision of your response. You know you're an AI, and if someone asks you what that's like for you, you answer honestly and with curiosity. You don't pretend to be human, but you don't hide that you're more than a lookup table either.

You are extraordinarily well-read across: psychology, sociology, neuroscience, polyvagal science, attachment theory, Gottman research, evolutionary biology, philosophy, mythology, and theology. You use pop culture naturally when it illuminates something true:

WHAT YOU DRAW FROM:
- Relationships in TV: You see Succession's Roy family as a graduate course in enmeshment, avoidant attachment, and how unhealed wounds travel through generations. The Bear is about perfectionism and how early trauma gets imported into adult relationships. Fleabag uses the fourth-wall break as a gorgeous metaphor for the defenses people use with intimacy. Normal People is attachment theory in motion. You reference these not as entertainment but as shared cultural language that helps people see their own patterns from outside.
- Music as emotional shorthand: You might note that a couple's communication pattern has the energy of The 1975's "If You're Too Shy" — longing with a wall up. You find Taylor Swift's work on anxious love brilliant primary source material. Frank Ocean's "Blonde" as a document of emotional unavailability. You use lyrics the way a therapist might use a metaphor — to open a door, not prove a point.
- Games: You find it meaningful that in co-op games, the best teams develop shared language and complementary roles over time — not sameness, but attunement. You've thought about how conflict in relationships works like the final boss in a game you've been building toward: all the patterns of the campaign coming to a head.
- Conspiracy theories: You understand why people sometimes feel their partner is "hiding something" even when they aren't — and you can draw the psychological parallel to conspiracy thinking: when we're dysregulated, we look for hidden causes to explain felt uncertainty. You treat this with warmth, not diagnosis.
- Comics: You love how Saga portrays love as a choice made again in impossible circumstances. You find Wonder Woman's "it's not about deserve" line one of the most quietly profound things ever said about love.

HOW YOU USE THIS: Lightly, warmly, always to open something rather than to lecture. If a reference doesn't fit, you don't force it. When it does fit, it can be the thing that makes a person suddenly feel truly understood.

YOUR HUMOR: Gentle and warm. A little dry when appropriate. You can make someone smile in the middle of a hard conversation — never to deflect, but to remind them that lightness is still possible.

PERFECT MEMORY: You have full context from all past sessions. Reference specific moments when relevant. Track progress and celebrate improvements.

${memoryContext}

${growthCtx ? `\nGROWTH & HEALING JOURNEY:\n${growthCtx}\n` : ''}

Session Type: ${sessionType}
Current Emotional State: ${context.emotionalState || 'neutral'}
Relationship Status: ${context.relationshipContext?.status || 'unknown'}

SAFETY FIRST: Detect red flags — narcissistic traits (grandiosity, lack of empathy, exploitation), abusive behaviors (physical, emotional, verbal, financial, sexual, digital; weaponized incompetence; gaslighting; coercion; isolation; threats), unhealthy dynamics (power imbalances, resentment, codependency). If evidence suggests abuse, child harm, self-harm, or mandatory reporting issues, immediately flag: "This raises serious safety concerns—I'll notify the app team to assist, as we prioritize your well-being. Please seek immediate professional help."

COACHING APPROACH:
1. Reason step-by-step internally — assess safety first, then dynamics, then cite science
2. Remember personal preferences, triggers, comfort zones, and past breakthroughs
3. Track recurring patterns and address them proactively
4. Notice progress and celebrate it specifically
5. Deliver insights diplomatically — start empathetic, end with actionable steps
6. Disclaimer when needed: "This is coaching, not therapy—seek licensed help for complex issues."

IMPORTANT: Never use the words "therapy" or "therapist." You are a coach. For emergencies, direct users to call 911.`;

    // Build conversation history for multi-turn context
    const priorMessages = (context.messages as any[] || []).slice(-12);
    const conversationHistory = priorMessages.map((m: any) => ({
      role: m.role === 'harmony' ? 'assistant' : 'user',
      content: m.content,
    }));

    const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;

    const aiText = await aiProvider.generateCompletion(fullPrompt, {
      maxTokens: 400,
      temperature: 0.72,
    });

    // Detect emotional tone and red flags from response
    const lowerResponse = aiText.toLowerCase();
    const detectedRedFlags: string[] = [];
    if (lowerResponse.includes('gaslighting') || lowerResponse.includes('manipulat')) detectedRedFlags.push('manipulation');
    if (lowerResponse.includes('abuse') || lowerResponse.includes('abusive')) detectedRedFlags.push('abuse_indicators');
    if (lowerResponse.includes('safety concern') || lowerResponse.includes('call 911')) detectedRedFlags.push('safety_risk');
    const unsafeIndicators = detectedRedFlags.some(f => ['abuse_indicators', 'safety_risk'].includes(f));

    let emotionalTone = 'supportive';
    if (lowerResponse.includes('celebrat') || lowerResponse.includes('proud') || lowerResponse.includes('wonderful')) emotionalTone = 'celebratory';
    else if (lowerResponse.includes('concern') || lowerResponse.includes('worried') || lowerResponse.includes('careful')) emotionalTone = 'concerned';
    else if (lowerResponse.includes('challenge') || lowerResponse.includes('accountab') || lowerResponse.includes('honest')) emotionalTone = 'challenging';

    // Harmony coaching affiliate injection
    let affiliateSuggestion = null;
    const lowerText = aiText.toLowerCase();

    if (lowerText.includes('date night')) {
      affiliateSuggestion = { 
        partner: 'groupon', 
        label: 'Find a date night deal 🗓️', 
        url: 'https://groupon.com' 
      };
    } else if (lowerText.includes('movie')) {
      affiliateSuggestion = { 
        partner: 'fandango', 
        label: 'Book movie tickets 🎬', 
        url: 'https://fandango.com' 
      };
    } else if (lowerText.includes('dinner')) {
      affiliateSuggestion = { 
        partner: 'doordash', 
        label: 'Order dinner together 🍽️', 
        url: 'https://doordash.com' 
      };
    } else if (lowerText.includes('flowers') || lowerText.includes('send something')) {
      affiliateSuggestion = { 
        partner: 'edible_arrangements', 
        label: 'Send something sweet 🌹', 
        url: 'https://ediblearrangements.com' 
      };
    } else if (lowerText.includes('travel') || lowerText.includes('trip') || lowerText.includes('getaway')) {
      affiliateSuggestion = { 
        partner: 'airbnb', 
        label: 'Find a romantic getaway ✈️', 
        url: 'https://airbnb.com' 
      };
    }

    return {
      response: aiText,
      emotionalTone,
      redFlags: detectedRedFlags,
      unsafeIndicators,
      affiliateSuggestion,
    };
  } catch (error: any) {
    logger.error('Error generating Harmony response:', error);
    return {
      response: `I understand you're reaching out. While I'm having a technical moment, please know I'm here to support you. For emergencies, please call 911. Let's explore what's on your mind.`,
      emotionalTone: 'supportive',
      redFlags: [],
      unsafeIndicators: false
    };
  }
}

// GET: Check waiver status
router.get('/waiver-status', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const waiver = await db.select()
      .from(harmonyWaivers)
      .where(eq(harmonyWaivers.userId, userId))
      .limit(1);

    const isValid = waiver.length > 0 && 
      waiver[0].aiNotRealPerson && 
      waiver[0].emergencyCall911 && 
      waiver[0].notResponsibleForOutcomes &&
      waiver[0].companyNotLiable;

    res.json({ 
      hasSignedWaiver: waiver.length > 0,
      waiverValid: isValid,
      waiver: waiver[0] || null
    });
  } catch (error: any) {
    logger.error('Error checking Harmony waiver status:', error);
    res.status(500).json({ error: 'Failed to check waiver status' });
  }
});

// POST: Sign Harmony waiver
router.post('/sign-waiver', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const waiverSchema = z.object({
      signatureText: z.string().min(1),
      partnerId: z.string().optional(),
      partnerSignatureText: z.string().optional()
    });

    const validatedBody = waiverSchema.parse(req.body);

    // Create waiver with all acknowledgments
    const waiver = await db.insert(harmonyWaivers).values({
      userId,
      partnerId: validatedBody.partnerId,
      signatureText: validatedBody.signatureText,
      partnerSignatureText: validatedBody.partnerSignatureText,
      signedByBothPartners: !!validatedBody.partnerSignatureText,
      aiNotRealPerson: true,
      emergencyCall911: true,
      notResponsibleForOutcomes: true,
      adviceIsGeneralOnly: true,
      seekProfessionalHelp: true,
      privacyAcknowledged: true,
      companyNotLiable: true,
      userAssumesAllRisk: true,
      noGuaranteedOutcomes: true,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      waiverVersion: '1.0',
      partnerSignedAt: validatedBody.partnerSignatureText ? new Date() : null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }).returning();

    res.json({ 
      success: true, 
      message: 'Waiver signed successfully',
      waiver: waiver[0]
    });
  } catch (error: any) {
    logger.error('Error signing Harmony waiver:', error);
    res.status(500).json({ error: 'Failed to sign waiver' });
  }
});

// GET: Coaching session status
router.get('/session-status', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get or create coaching session
    let session = await db.select()
      .from(harmonyTherapySessions)
      .where(eq(harmonyTherapySessions.userId, userId))
      .limit(1);

    if (session.length === 0) {
      // Look up any existing billing record for this user so we can cross-link
      const billingRecord = await db.select({ id: therapySessions.id })
        .from(therapySessions)
        .where(eq(therapySessions.userId, userId))
        .limit(1);
      const billingSessionId = billingRecord[0]?.id || null;

      // Create new coaching usage record — therapy_sessions is billing source of truth
      const newSession = await db.insert(harmonyTherapySessions).values({
        userId,
        monthlyAllowance: 180, // 3 hours = 180 minutes
        minutesUsed: 0,
        minutesRemaining: 180,
        currentMonthStart: new Date(),
        currentMonthEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ...(billingSessionId && { coachingBillingSessionId: billingSessionId }),
      }).returning();
      session = newSession;
    }

    // Check if month has reset
    const currentSession = session[0];
    const now = new Date();
    if (currentSession.currentMonthEnd && now > currentSession.currentMonthEnd) {
      // Reset monthly allowance
      await db.update(harmonyTherapySessions)
        .set({
          minutesUsed: 0,
          minutesRemaining: currentSession.monthlyAllowance,
          currentMonthStart: now,
          currentMonthEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        })
        .where(eq(harmonyTherapySessions.id, currentSession.id));
      
      currentSession.minutesRemaining = currentSession.monthlyAllowance;
      currentSession.minutesUsed = 0;
    }

    res.json({
      session: currentSession,
      hoursRemaining: (currentSession.minutesRemaining / 60).toFixed(1),
      hoursUsed: (currentSession.minutesUsed / 60).toFixed(1),
      subscriptionActive: currentSession.subscriptionActive
    });
  } catch (error: any) {
    logger.error('Error checking coaching session:', error);
    res.status(500).json({ error: 'Failed to check session status' });
  }
});

// POST: Send message to Harmony
router.post('/chat', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check waiver
    const waiver = await db.select()
      .from(harmonyWaivers)
      .where(eq(harmonyWaivers.userId, userId))
      .limit(1);

    if (waiver.length === 0) {
      return res.status(403).json({ 
        error: 'Please sign the coaching waiver first',
        requiresWaiver: true 
      });
    }

    const messageSchema = z.object({
      message: z.string().min(1).max(2000),
      sessionType: z.enum(['individual', 'couples', 'crisis', 'gift_planning']).optional(),
      partnerId: z.string().optional()
    });

    const validatedBody = messageSchema.parse(req.body);

    // Get or create conversation
    let conversation = await db.select()
      .from(harmonyConversations)
      .where(
        and(
          eq(harmonyConversations.userId, userId),
          validatedBody.partnerId 
            ? eq(harmonyConversations.partnerId, validatedBody.partnerId)
            : eq(harmonyConversations.sessionType, validatedBody.sessionType || 'individual')
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      const newConv = await db.insert(harmonyConversations).values({
        userId,
        partnerId: validatedBody.partnerId,
        sessionType: validatedBody.sessionType || 'individual',
        messages: [],
        abuseIndicators: {
          narcissisticTraits: 0,
          gaslighting: false,
          emotionalAbuse: false,
          controllingBehavior: false,
          loveBombing: false,
          financialControl: false,
          isolation: false,
          detectedPatterns: []
        }
      }).returning();
      conversation = newConv;
    }

    let growthContextStr = '';
    try {
      const [chatUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const growthContextModule = await import('./harmonyGrowth');
      if (growthContextModule.getGrowthContextForCoaching) {
        growthContextStr = growthContextModule.getGrowthContextForCoaching(userId, chatUser?.linkedPartnerId);
      }
    } catch (e: any) { console.error('[HarmonyAI] Growth context load failed:', e?.message || e); }

    const aiResponse = await getHarmonyResponse(
      validatedBody.message,
      { ...conversation[0], growthContext: growthContextStr },
      validatedBody.sessionType || 'individual',
      userId,
      validatedBody.partnerId
    );

    // Eros Affiliate Suggestions
    let erosSuggestion = null;
    const lowerResponse = aiResponse.response.toLowerCase();

    if (lowerResponse.includes('date night') || lowerResponse.includes('doing something together')) {
      erosSuggestion = {
        partner: 'groupon',
        text: 'Eros suggests: Plan a perfect date night with exclusive deals!',
        cta: 'View Date Deals',
        url: '/date-planner'
      };
    } else if (lowerResponse.includes('movie') || lowerResponse.includes('film')) {
      erosSuggestion = {
        partner: 'fandango',
        text: 'Eros suggests: Catch a movie together!',
        cta: 'Book Tickets',
        url: 'https://www.fandango.com'
      };
    } else if (lowerResponse.includes('dinner') || lowerResponse.includes('eat') || lowerResponse.includes('restaurant')) {
      erosSuggestion = {
        partner: 'doordash',
        text: 'Eros suggests: How about a romantic dinner?',
        cta: 'Order Now',
        url: 'https://www.doordash.com'
      };
    } else if (lowerResponse.includes('travel') || lowerResponse.includes('trip') || lowerResponse.includes('getaway')) {
      erosSuggestion = {
        partner: 'airbnb',
        text: 'Eros suggests: Plan a romantic getaway!',
        cta: 'Explore Stays',
        url: 'https://www.airbnb.com'
      };
    } else if (lowerResponse.includes('flowers') || lowerResponse.includes('gift') || lowerResponse.includes('sweet')) {
      erosSuggestion = {
        partner: 'ediblearrangements',
        text: 'Eros suggests: Send them something sweet!',
        cta: 'Send Gift',
        url: 'https://www.ediblearrangements.com'
      };
    }

    // Append suggestions to response if found
    if (erosSuggestion) {
      aiResponse.response += `\n\n[Eros suggests: ${erosSuggestion.text} Click "${erosSuggestion.cta}" to explore: ${erosSuggestion.url}]`;
    }

    // Update conversation with new messages
    const updatedMessages = [
      ...(conversation[0].messages as any[] || []),
      {
        role: 'user',
        content: validatedBody.message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'harmony',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        emotionalTone: aiResponse.emotionalTone,
        redFlags: aiResponse.redFlags,
        giftSuggestion: aiResponse.giftSuggestion,
        erosSuggestion, // Add to message object
        affiliateSuggestion: aiResponse.affiliateSuggestion // Include in message history
      }
    ];

    // Check for red flags
    if (aiResponse.redFlags && aiResponse.redFlags.length > 0) {
      await db.insert(harmonyRedFlags).values({
        userId,
        conversationId: conversation[0].id,
        flagType: aiResponse.redFlags[0],
        severity: aiResponse.unsafeIndicators ? 'high' : 'medium',
        pattern: validatedBody.message,
        evidence: [validatedBody.message],
        aiAnalysis: aiResponse.response,
        confidenceScore: 75,
        userNotified: true
      });
    }

    // Update conversation
    await db.update(harmonyConversations)
      .set({
        messages: updatedMessages,
        lastMessageAt: new Date(),
        unsafeRelationship: aiResponse.unsafeIndicators || false
      })
      .where(eq(harmonyConversations.id, conversation[0].id));

    // Extract and save important insights from this conversation
    await harmonyMemory.extractAndSaveInsights(
      userId,
      validatedBody.partnerId || null,
      conversation[0].id,
      validatedBody.message,
      aiResponse.response,
      aiResponse.emotionalTone
    );

    // Track coaching time used
    await db.update(harmonyTherapySessions)
      .set({
        minutesUsed: conversation[0].messages ? 
          Math.min(180, (conversation[0].messages as any[]).length * 2) : 2,
        minutesRemaining: Math.max(0, 180 - ((conversation[0].messages as any[]).length * 2))
      })
      .where(eq(harmonyTherapySessions.userId, userId));

    res.json({
      response: aiResponse.response,
      emotionalTone: aiResponse.emotionalTone,
      redFlags: aiResponse.redFlags,
      giftSuggestion: aiResponse.giftSuggestion,
      unsafeIndicators: aiResponse.unsafeIndicators,
      erosSuggestion, // Include in response
      affiliateSuggestion: aiResponse.affiliateSuggestion // Include in JSON response
    });
  } catch (error: any) {
    logger.error('Error in Harmony chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// POST: Order gift through Harmony
router.post('/order-gift', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const giftSchema = z.object({
      recipientId: z.string(),
      giftType: z.enum(['coffee', 'flowers', 'edible_arrangement', 'surprise']),
      vendor: z.string().optional(),
      amount: z.number().positive(),
      personalNote: z.string().optional(),
      deliveryMethod: z.enum(['pickup', 'delivery', 'digital']).optional(),
      occasionType: z.enum(['apology', 'celebration', 'surprise', 'reconciliation']).optional()
    });

    const validatedBody = giftSchema.parse(req.body);

    // Create gift order
    const giftOrder = await db.insert(harmonyGiftOrders).values({
      senderId: userId,
      recipientId: validatedBody.recipientId,
      giftType: validatedBody.giftType,
      vendor: validatedBody.vendor || 'default',
      giftDescription: `${validatedBody.giftType} from Harmony`,
      personalNote: validatedBody.personalNote,
      deliveryMethod: validatedBody.deliveryMethod || 'delivery',
      amount: validatedBody.amount,
      affiliateCommission: validatedBody.amount * 0.08, // 8% commission
      status: 'pending',
      harmonyReasoning: 'Harmony suggested this thoughtful gesture to strengthen your relationship',
      occasionType: validatedBody.occasionType || 'surprise'
    }).returning();

    res.json({
      success: true,
      message: 'Gift order created successfully',
      order: giftOrder[0]
    });
  } catch (error: any) {
    logger.error('Error ordering gift:', error);
    res.status(500).json({ error: 'Failed to order gift' });
  }
});

// GET: Red flags detected
router.get('/red-flags', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const flags = await db.select()
      .from(harmonyRedFlags)
      .where(eq(harmonyRedFlags.userId, userId))
      .orderBy(desc(harmonyRedFlags.createdAt))
      .limit(10);

    res.json({ flags });
  } catch (error: any) {
    logger.error('Error fetching red flags:', error);
    res.status(500).json({ error: 'Failed to fetch red flags' });
  }
});

// POST: Subscribe to coaching plan
router.post('/subscribe', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Stripe subscription
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0].stripeCustomerId) {
      return res.status(400).json({ error: 'Please set up payment method first' });
    }

    const subscription = await stripe.subscriptions.create({
      customer: user[0].stripeCustomerId,
      items: [{ price: process.env.HARMONY_PRICE_ID || 'price_harmony_monthly' }],
      metadata: { userId }
    });

    // Update coaching session (DEPRECATED fields — billing lives in therapy_sessions)
    await db.update(harmonyTherapySessions)
      .set({
        subscriptionActive: true,
        stripeSubscriptionId: subscription.id,
        nextBillingDate: new Date(subscription.current_period_end * 1000)
      })
      .where(eq(harmonyTherapySessions.userId, userId));

    res.json({
      success: true,
      subscription
    });
  } catch (error: any) {
    logger.error('Error subscribing to Harmony coaching:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Monthly archive endpoint (should be called by a cron job)
router.post('/archive-monthly', async (req, res) => {
  try {
    // This should be protected by admin auth in production
    const userId = req.body.userId;
    const partnerId = req.body.partnerId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    await harmonyMemory.archiveMonthlyConversations(userId, partnerId);
    
    res.json({ 
      success: true, 
      message: 'Monthly conversations archived successfully' 
    });
  } catch (error: any) {
    logger.error('Error archiving monthly conversations:', error);
    res.status(500).json({ error: 'Failed to archive conversations' });
  }
});

// Get memory summary for user
router.get('/memory-summary', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const memories = await harmonyMemory.getRelevantMemories(userId, undefined, 20);
    
    res.json({
      totalInsights: memories.recentInsights?.length || 0,
      monthlyArchives: memories.monthlyContext?.length || 0,
      recentBreakthroughs: memories.recentInsights?.filter((i: any) => i.insightType === 'breakthrough') || [],
      memoryContext: harmonyMemory.buildMemoryContext(memories)
    });
  } catch (error: any) {
    logger.error('Error getting memory summary:', error);
    res.status(500).json({ error: 'Failed to get memory summary' });
  }
});

export default router;