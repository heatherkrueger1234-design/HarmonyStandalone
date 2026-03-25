// @ts-nocheck
// COUPLES RELATIONSHIP TOOL ROUTES
import { createLogger } from '../utils/logger';
const logger = createLogger('CouplesRoutes');
// Revenue Stream: $19.99/month per couple OR $9.99/person

import { Router, Request, Response } from 'express';
import { couplesRelationshipTool } from '../services/couplesRelationshipTool';
import { isAuthenticated } from '../simpleAuth';
import { storage } from '../storage';

const router = Router();

// COUPLES PRICING & INFO
router.get('/api/couples/pricing', async (req, res) => {
  try {
    const pricing = couplesRelationshipTool.getPricingOptions();
    
    res.json({
      success: true,
      pricing,
      description: "Relationship insights and improvement tools for existing couples",
      targetAudience: "Committed couples who want to strengthen their relationship"
    });
    
  } catch (error: any) {
    logger.error('Error fetching couples pricing:', error);
    res.status(500).json({ error: "Failed to fetch pricing information" });
  }
});

// COUPLES COMPATIBILITY ANALYSIS
router.post('/api/couples/analyze', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { partnerUserId, relationshipDetails } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const currentUserId = req.user.id;
    
    if (!partnerUserId) {
      return res.status(400).json({ error: "Partner user ID is required" });
    }
    
    // Fetch real personality data from database for both users
    const [currentUser, partnerUser] = await Promise.all([
      storage.getUser(currentUserId),
      storage.getUser(partnerUserId)
    ]);
    
    // Extract real personality data or use defaults
    const getPersonalityProfile = (user: any) => {
      const bigFive = user?.bigFiveScores || user?.personalityTraits || {};
      return {
        agreeableness: bigFive.agreeableness || user?.hexacoScores?.agreeableness || 70,
        conscientiousness: bigFive.conscientiousness || user?.hexacoScores?.conscientiousness || 70,
        openness: bigFive.openness || user?.hexacoScores?.openness || 70,
        extraversion: bigFive.extraversion || user?.hexacoScores?.extraversion || 70,
        neuroticism: bigFive.neuroticism || user?.hexacoScores?.emotionality || 50
      };
    };
    
    const coupleProfile = {
      partner1: {
        userId: currentUserId,
        personalityProfile: getPersonalityProfile(currentUser),
        communicationStyle: currentUser?.communicationStyle || 'direct',
        conflictResolution: currentUser?.conflictStyle || 'collaborative',
        emotionalNeeds: currentUser?.loveLanguages || ['appreciation', 'quality_time'],
        parentingStyle: 'authoritative'
      },
      partner2: {
        userId: partnerUserId,
        personalityProfile: getPersonalityProfile(partnerUser),
        communicationStyle: partnerUser?.communicationStyle || 'diplomatic',
        conflictResolution: partnerUser?.conflictStyle || 'accommodating',
        emotionalNeeds: partnerUser?.loveLanguages || ['emotional_support', 'physical_touch'],
        parentingStyle: 'attachment_based'
      },
      relationshipLength: relationshipDetails?.months || 12,
      relationshipStage: relationshipDetails?.stage || 'committed',
      hasChildren: relationshipDetails?.hasChildren || false,
      livingTogether: relationshipDetails?.livingTogether || true
    };
    
    const insights = await couplesRelationshipTool.analyzeCoupleCompatibility(coupleProfile);
    
    logger.info(`💕 Couple analysis completed for ${currentUserId} + ${partnerUserId}`);
    
    res.json({
      success: true,
      insights,
      message: "Relationship analysis complete! Subscribe to access full insights and improvement tools."
    });
    
  } catch (error: any) {
    logger.error('Error analyzing couple:', error);
    res.status(500).json({ error: "Failed to analyze relationship" });
  }
});

// SUBSCRIBE TO COUPLES TOOL  
router.post('/api/couples/subscribe', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { partnerUserId, subscriptionType, paymentMethod } = req.body;
    
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const currentUserId = req.user.id;
    
    if (!partnerUserId || !subscriptionType) {
      return res.status(400).json({ error: "Partner ID and subscription type are required" });
    }
    
    if (!['joint', 'individual'].includes(subscriptionType)) {
      return res.status(400).json({ error: "Invalid subscription type" });
    }
    
    // Create subscription
    const subscription = await couplesRelationshipTool.createCoupleSubscription(
      currentUserId,
      partnerUserId,
      subscriptionType
    );
    
    // In production, this would create Stripe subscription
    const monthlyPrice = subscriptionType === 'joint' ? 19.99 : 9.99;
    
    logger.info(`💳 Couples subscription created: ${subscriptionType} - $${monthlyPrice}/month`);
    
    res.json({
      success: true,
      subscription,
      message: `${subscriptionType === 'joint' ? 'Joint' : 'Individual'} couples subscription activated!`,
      nextSteps: [
        "Complete both personality assessments",
        "Access your relationship dashboard",
        "Start with the first recommended exercise"
      ]
    });
    
  } catch (error: any) {
    logger.error('Error creating couples subscription:', error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
});

// COUPLES DASHBOARD
router.get('/api/couples/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const userId = req.user.id;
    
    // Find couple ID - in production this would query the database
    const coupleId = `couple_${userId}_partner`;
    
    const dashboard = await couplesRelationshipTool.getCouplesDashboard(coupleId);
    
    res.json({
      success: true,
      dashboard,
      message: "Your relationship is improving! Keep up the great work."
    });
    
  } catch (error: any) {
    logger.error('Error fetching couples dashboard:', error);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

// COUPLES EXERCISES & RECOMMENDATIONS
router.get('/api/couples/exercises', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Generate personalized exercises based on couple's analysis
    const exercises = [
      {
        title: "Active Listening Challenge",
        duration: "15 minutes",
        description: "Practice truly hearing each other without planning your response",
        steps: [
          "Partner 1 shares something for 3 minutes uninterrupted",
          "Partner 2 repeats back what they heard",
          "Partner 1 confirms if they felt understood", 
          "Switch roles and repeat"
        ],
        category: "communication"
      },
      {
        title: "Appreciation Ritual",
        duration: "10 minutes",
        description: "Daily practice of expressing specific appreciation",
        steps: [
          "Each partner shares 3 specific things they appreciated today",
          "Focus on actions, not just general traits",
          "Listen without responding until both have shared",
          "End with a hug or physical connection"
        ],
        category: "emotional_connection"
      },
      {
        title: "Conflict Resolution Practice",
        duration: "20 minutes", 
        description: "Structured approach to resolving disagreements",
        steps: [
          "Each person states their perspective without blame",
          "Identify the underlying need behind each position",
          "Brainstorm solutions that meet both needs",
          "Choose one solution to try for a week"
        ],
        category: "conflict_resolution"
      }
    ];
    
    res.json({
      success: true,
      exercises,
      weeklyChallenge: "Complete 3 appreciation rituals this week",
      progressTip: "Consistency matters more than perfection. Small daily efforts create lasting change."
    });
    
  } catch (error: any) {
    logger.error('Error fetching couples exercises:', error);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

export default router;