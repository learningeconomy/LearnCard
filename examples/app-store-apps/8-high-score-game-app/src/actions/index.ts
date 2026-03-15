import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

// Achievement tiers
const ACHIEVEMENT_TIERS = {
  bronze: {
    name: 'Bronze Space Pilot',
    description: 'Achieved a score of 1,000+ points in Space Dodger',
    minScore: 1000,
    color: '#CD7F32',
    icon: '🥉'
  },
  silver: {
    name: 'Silver Space Pilot', 
    description: 'Achieved a score of 5,000+ points in Space Dodger',
    minScore: 5000,
    color: '#C0C0C0',
    icon: '🥈'
  },
  gold: {
    name: 'Gold Space Pilot',
    description: 'Achieved a score of 10,000+ points in Space Dodger', 
    minScore: 10000,
    color: '#FFD700',
    icon: '🥇'
  },
  platinum: {
    name: 'Platinum Space Ace',
    description: 'Achieved a legendary score of 25,000+ points in Space Dodger',
    minScore: 25000,
    color: '#E5E4E2',
    icon: '💎'
  }
};

export const server = {
  validateAchievement: defineAction({
    input: z.object({
      score: z.number(),
      tier: z.enum(['bronze', 'silver', 'gold', 'platinum'])
    }),
    handler: async (input) => {
      const tier = ACHIEVEMENT_TIERS[input.tier];
      
      if (input.score < tier.minScore) {
        throw new Error(`Score ${input.score} does not meet ${input.tier} tier requirement of ${tier.minScore}`);
      }

      return {
        tier: input.tier,
        score: input.score,
        name: tier.name,
        description: tier.description,
        icon: tier.icon,
        color: tier.color,
        minScore: tier.minScore
      };
    }
  }),

  getEligibleTiers: defineAction({
    input: z.object({
      score: z.number()
    }),
    handler: async (input) => {
      const eligible = Object.entries(ACHIEVEMENT_TIERS)
        .filter(([_, tier]) => input.score >= tier.minScore)
        .map(([key, tier]) => ({ key, ...tier }));
      
      return { eligible, score: input.score };
    }
  })
};
