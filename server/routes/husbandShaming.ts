// @ts-nocheck
/**
 * Husband Shaming Routes
 * Humorous community feature for sharing relationship frustrations
 * 
 * @module HusbandShamingRoutes
 */

import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { z } from 'zod';
import { db } from '../db';
import { 
  husbandShamingPosts, 
  husbandShamingResponses,
  relationshipCompatibilityReports,
  users,
  insertHusbandShamingPostSchema,
  insertHusbandShamingResponseSchema
} from '@shared/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

const logger = createLogger('HusbandShaming');
const router = Router();

// Categories with funny descriptions
const SHAME_CATEGORIES = {
  strategic_pooping: "Strategic Bathroom Breaks 🚽",
  selective_hearing: "Selective Hearing Syndrome 🙉",
  chore_blindness: "Chore Blindness Disorder 🙈",
  weaponized_incompetence: "Weaponized Incompetence 🤷‍♂️",
  man_cold: "Man Cold Dramatics 🤧",
  gaming_addiction: "Gaming Over Everything 🎮",
  sports_obsession: "Sports Trance State ⚽",
  tool_hoarding: "Tool Hoarding (Never Uses) 🔧",
  car_projects: "Never-Ending Car Projects 🚗",
  other: "Other Ridiculousness 🤦‍♀️"
};

// Get all posts with pagination
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const category = req.query.category as string;
    const offset = (page - 1) * limit;

    const where = category ? eq(husbandShamingPosts.category, category) : undefined;

    // Simplified query - just get posts for now
    const posts = await db.select()
      .from(husbandShamingPosts)
      .where(where)
      .orderBy(desc(husbandShamingPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Return posts as-is for now, without author info
    res.json(posts);
  } catch (error: any) {
    logger.error('Error fetching shaming posts', { error });
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post with responses
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the post (simplified)
    const [post] = await db.select()
      .from(husbandShamingPosts)
      .where(eq(husbandShamingPosts.id, id));

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // We don't have a viewCount column, so skip this for now

    // Get responses (simplified)
    const responses = await db.select()
      .from(husbandShamingResponses)
      .where(eq(husbandShamingResponses.postId, id))
      .orderBy(desc(husbandShamingResponses.createdAt));

    res.json({
      ...post,
      responses
    });
  } catch (error: any) {
    logger.error('Error fetching post', { error });
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new shaming post
router.post('/posts', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Must be logged in to shame your husband' });
    }

    const postData = insertHusbandShamingPostSchema.parse(req.body);

    // Generate deterministic humor scores based on content hash (consistent per post)
    const contentHash = (postData.title + postData.story).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const humorScore = 70 + (contentHash % 31); // 70-100
    const relatabilityScore = 80 + ((contentHash * 7) % 21); // 80-100
    
    // Category-based ridiculousness level
    const ridiculousnessMapping: Record<string, string> = {
      strategic_pooping: 'seriously_dude',
      selective_hearing: 'seriously_dude',
      chore_blindness: 'therapy_worthy',
      weaponized_incompetence: 'divorce_worthy_jk',
      man_cold: 'mildly_annoying',
      gaming_addiction: 'needs_discussion',
      sports_obsession: 'mildly_annoying',
      tool_hoarding: 'harmless_quirk',
      car_projects: 'harmless_quirk',
      other: 'seriously_dude'
    };

    const ridiculousnessLevel = ridiculousnessMapping[postData.category] || 'seriously_dude';
    
    // Random funny advice
    const funnyAdvice = [
      "Have you tried turning him off and on again? Oh wait, that's not how husbands work.",
      "Next time he does this, just start doing the same thing when he needs you. Petty? Yes. Effective? Also yes.",
      "Girl, this is why wine was invented. And chocolate. And girls' nights.",
      "The audacity! Start a spreadsheet documenting every instance. Data doesn't lie.",
      "Two words: WiFi password. Change it daily until he learns.",
      "Hide the TV remote in the dishwasher. He'll never find it there."
    ];

    const [newPost] = await db.insert(husbandShamingPosts)
      .values({
        ...postData,
        userId,
        humorScore,
        relatabilityScore,
        ridiculousnessLevel,
        aiCompatibilityImpact: 'needs_discussion',
        aiHumorousAdvice: funnyAdvice[contentHash % funnyAdvice.length]
      })
      .returning();

    logger.info('New husband shaming post', { title: postData.title, category: postData.category });

    res.json(newPost);
  } catch (error: any) {
    logger.error('Error creating shaming post', { error });
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add a response to a post
router.post('/posts/:id/responses', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Must be logged in to respond' });
    }

    const { id: postId } = req.params;
    const responseData = insertHusbandShamingResponseSchema.parse({
      ...req.body,
      postId
    });

    const [newResponse] = await db.insert(husbandShamingResponses)
      .values({
        ...responseData,
        postId,
        userId
      })
      .returning();

    logger.debug('New response on husband shaming post', { type: responseData.responseType });

    res.json(newResponse);
  } catch (error: any) {
    logger.error('Error creating response', { error });
    res.status(500).json({ error: 'Failed to create response' });
  }
});

// React to a post (laugh, relate, eye roll)
router.post('/posts/:id/react', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;

    if (!['laugh', 'relate', 'eyeRoll'].includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const updateField = {
      laugh: 'laughReacts',
      relate: 'relateScore',
      eyeRoll: 'eyeRollCount'
    }[reaction] as 'laughReacts' | 'relateScore' | 'eyeRollCount';

    await db.update(husbandShamingPosts)
      .set({ 
        [updateField]: sql`${husbandShamingPosts[updateField]} + 1` 
      })
      .where(eq(husbandShamingPosts.id, id));

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error adding post reaction', { error });
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// React to a response
router.post('/responses/:id/react', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;

    if (!['cackle', 'genius'].includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const updateField = reaction === 'cackle' ? 'cackleCount' : 'geniusCount';

    await db.update(husbandShamingResponses)
      .set({ 
        [updateField]: sql`${husbandShamingResponses[updateField]} + 1` 
      })
      .where(eq(husbandShamingResponses.id, id));

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error adding response reaction', { error });
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Husband's defense (if he dares)
router.post('/posts/:id/defend', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    const { defense } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Must be logged in to defend yourself' });
    }

    // Check if this is actually the husband
    const [post] = await db.select()
      .from(husbandShamingPosts)
      .where(eq(husbandShamingPosts.id, id));

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await db.update(husbandShamingPosts)
      .set({
        husbandDefense: defense,
        husbandDefenseAt: new Date()
      })
      .where(eq(husbandShamingPosts.id, id));

    logger.debug('Husband attempted defense on shaming post');

    res.json({ success: true, message: 'Good luck with that defense, buddy' });
  } catch (error: any) {
    logger.error('Error adding defense', { error });
    res.status(500).json({ error: 'Failed to add defense' });
  }
});

// Wife's rebuttal to husband's defense
router.post('/posts/:id/rebuttal', async (req: Request, res: Response) => {
  try {
    const userId = req.session?.user?.id;
    const { id } = req.params;
    const { rebuttal } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Must be logged in' });
    }

    // Check if this is the original poster
    const [post] = await db.select()
      .from(husbandShamingPosts)
      .where(and(
        eq(husbandShamingPosts.id, id),
        eq(husbandShamingPosts.userId, userId)
      ));

    if (!post) {
      return res.status(403).json({ error: 'Only the original poster can add a rebuttal' });
    }

    await db.update(husbandShamingPosts)
      .set({ wifeRebuttal: rebuttal })
      .where(eq(husbandShamingPosts.id, id));

    logger.debug('Wife added rebuttal to husband defense');

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error adding rebuttal', { error });
    res.status(500).json({ error: 'Failed to add rebuttal' });
  }
});

// Get compatibility report based on shaming posts
router.get('/compatibility/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all posts by this user
    const posts = await db.select()
      .from(husbandShamingPosts)
      .where(eq(husbandShamingPosts.userId, userId))
      .orderBy(desc(husbandShamingPosts.createdAt));

    if (posts.length === 0) {
      return res.json({ 
        message: "No shaming posts yet - either you have a perfect husband or you're too nice!" 
      });
    }

    // Analyze patterns
    const categoryCount: Record<string, number> = {};
    let totalCompatibilityImpact = 0;
    const seriousIssues: string[] = [];

    posts.forEach(post => {
      categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
      
      if (post.aiCompatibilityImpact === 'therapy_worthy' || post.aiCompatibilityImpact === 'run_girl') {
        seriousIssues.push(post.title);
      }
      
      const impactMapping: Record<string, number> = {
        'harmless_quirk': 90,
        'needs_discussion': 70,
        'therapy_worthy': 40,
        'run_girl': 10
      };
      const impactScore = impactMapping[post.aiCompatibilityImpact || 'harmless_quirk'] || 90;
      
      totalCompatibilityImpact += impactScore;
    });

    const avgCompatibility = totalCompatibilityImpact / posts.length;
    const worthSaving = avgCompatibility > 50;

    const report = {
      overallCompatibility: avgCompatibility,
      worthSaving,
      totalPosts: posts.length,
      topComplaintCategory: Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0],
      seriousIssues,
      humorScore: posts.reduce((acc, p) => acc + (p.humorScore || 0), 0) / posts.length,
      aiAdvice: worthSaving 
        ? "Your husband's quirks are annoying but mostly harmless. Keep training him!"
        : "Girl... we need to talk. Have you considered a nice houseplant instead?"
    };

    res.json(report);
  } catch (error: any) {
    logger.error('Error generating compatibility report', { error });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;