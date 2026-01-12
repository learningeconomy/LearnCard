import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Hardcoded badge definitions for LoreCard
const BADGE_DEFINITIONS = [
  {
    id: 'teamwork',
    name: 'Teamwork Champion',
    icon: '🤝',
    color: '#3b82f6',
    description: 'Demonstrated exceptional collaboration and supported party members in achieving shared goals.',
    narrative: 'Earn this boost by consistently demonstrating exceptional abilities in collaborating with others, supporting teammates, and significantly contributing to achieving shared goals in projects or group activities.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'leadership',
    name: 'Natural Leader',
    icon: '👑',
    color: '#ef4444',
    description: 'Took initiative, made difficult decisions, and guided the party through challenging situations.',
    narrative: 'Earn this boost by demonstrating strong leadership qualities, taking initiative in group settings, making difficult decisions under pressure, and effectively guiding others through challenging situations.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'creativity',
    name: 'Creative Thinker',
    icon: '🎨',
    color: '#a855f7',
    description: 'Found innovative solutions to problems and brought imaginative ideas to the table.',
    narrative: 'Earn this boost by consistently thinking outside the box, proposing innovative solutions to complex problems, and bringing fresh, imaginative ideas that enhance group outcomes.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'problemSolving',
    name: 'Puzzle Master',
    icon: '🧩',
    color: '#14b8a6',
    description: 'Analyzed complex situations, identified patterns, and developed effective strategies.',
    narrative: 'Earn this boost by demonstrating exceptional analytical skills, identifying patterns in complex situations, and developing effective strategies to overcome challenges.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'empathy',
    name: 'Empathetic Soul',
    icon: '💝',
    color: '#ec4899',
    description: 'Showed understanding and compassion for others\' perspectives and feelings.',
    narrative: 'Earn this boost by consistently demonstrating deep understanding and compassion for others\' perspectives, feelings, and experiences, creating a supportive and inclusive environment.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'communication',
    name: 'Eloquent Speaker',
    icon: '💬',
    color: '#f59e0b',
    description: 'Communicated clearly, listened actively, and facilitated productive discussions.',
    narrative: 'Earn this boost by demonstrating clear and effective communication, active listening skills, and the ability to facilitate productive discussions that move groups forward.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'courage',
    name: 'Brave Heart',
    icon: '🛡️',
    color: '#dc2626',
    description: 'Faced fears, took calculated risks, and stood up for what\'s right.',
    narrative: 'Earn this boost by demonstrating bravery in the face of challenges, taking calculated risks when necessary, and standing up for principles and others even when difficult.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'wisdom',
    name: 'Wise Sage',
    icon: '📜',
    color: '#6366f1',
    description: 'Applied knowledge thoughtfully, learned from experience, and shared insights with others.',
    narrative: 'Earn this boost by thoughtfully applying knowledge and experience, demonstrating sound judgment, learning from past situations, and generously sharing insights with others.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  }
];

const ensureLearnCardIssuerProfileExists = async (learnCard: LearnCard) => {
  const issuerProfile = await learnCard.invoke.getProfile();

  if (!issuerProfile) {
    await learnCard.invoke.createProfile({
      profileId: 'lore-card-issuer',
      displayName: 'LoreCard Issuer',
      description: 'Issuer of LoreCard boost templates',
    });
  }
};

export const server = {
  getBoostTemplates: defineAction({
    handler: async () => {
      try {
        console.log('Initializing LearnCard...');

        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });

        await ensureLearnCardIssuerProfileExists(learnCard);

        const issuerDid = learnCard.id.did();

        console.log('Initializing LoreCard boost templates...');

        // Get existing boosts created by this issuer
        const existingBoosts = await learnCard.invoke.getPaginatedBoosts({
          limit: 100,
        });

        console.log(`Found ${existingBoosts.records.length} existing boosts`);

        const boostTemplates = [];

        // Process each badge definition
        for (const badge of BADGE_DEFINITIONS) {
          // Check if boost already exists for this badge
          const existingBoost = existingBoosts.records.find(
            (boost) => boost.name === badge.name
          );

          if (existingBoost && existingBoost.uri) {
            console.log(`Boost already exists for ${badge.name}: ${existingBoost.uri}`);
            boostTemplates.push({
              ...badge,
              uri: existingBoost.uri,
            });
          } else {
            // Create new boost
            console.log(`Creating boost for ${badge.name}...`);
            
            try {
              const credential = createCredentialTemplate(badge, issuerDid);
              const boostUri = await learnCard.invoke.createBoost(credential, {
                name: badge.name,
                category: 'Social Badge',
              });

              console.log(`Created boost for ${badge.name}: ${boostUri}`);

              boostTemplates.push({
                ...badge,
                uri: boostUri,
              });
            } catch (error) {
              console.error(`Error creating boost for ${badge.name}:`, error);
              // Continue with other badges even if one fails
            }
          }
        }

        return {
          boostTemplates,
          success: true,
        };
      } catch (error) {
        console.error('Error in getBoostTemplates:', error);
        return {
          boostTemplates: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
  nukeBoostTemplates: defineAction({
    handler: async () => {
      try {
        console.log('Initializing LearnCard...');

        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });

        await ensureLearnCardIssuerProfileExists(learnCard);

        const issuerDid = learnCard.id.did();

        console.log('Initializing LoreCard boost templates...');

        // Get existing boosts created by this issuer
        const existingBoosts = await learnCard.invoke.getPaginatedBoosts({
          limit: 100,
        });

        for (const boost of existingBoosts.records) {
          await learnCard.invoke.deleteBoost(boost.uri);
        }

        return {
          success: true,
        };
      } catch (error) {
        console.error('Error in nukeBoostTemplates:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
  assignAdminToBoostTemplates: defineAction({
    input: z.object({
      profileId: z.string(),
    }),
    handler: async (input) => {
        try {
            const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
            await ensureLearnCardIssuerProfileExists(learnCard);

            const boostTemplates = await learnCard.invoke.getPaginatedBoosts({
                limit: 100,
            });
            let success = true;
            for (const boostTemplate of boostTemplates.records) {
                try {
                    const addAdminSuccess = await learnCard.invoke.addBoostAdmin(boostTemplate.uri, input.profileId);
                    console.log(`Added ${input.profileId} as admin to ${boostTemplate.uri}:`, addAdminSuccess);
                    success = success && addAdminSuccess;
                } catch (error) {
                    console.error(`Error adding ${input.profileId} as admin to ${boostTemplate.uri}:`, error);
                }
            }
          
            return {
                success,
            };
        } catch (error) {
            console.error('Error in assignAdminToBoostTemplates:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
  }),
  getBoostRecipients: defineAction({
    input: z.object({
      boostUri: z.string(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureLearnCardIssuerProfileExists(learnCard);

        const recipients = await learnCard.invoke.getBoostRecipients(input.boostUri, 100);

        return {
          recipients,
          success: true,
        };
      } catch (error) {
        console.error('Error in getBoostRecipients:', error);
        return {
          recipients: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  })
};


// Helper function to create a credential template for a badge
function createCredentialTemplate(badge: typeof BADGE_DEFINITIONS[0], issuerDid: string) {
  return {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
      "https://ctx.learncard.com/boosts/1.0.2.json",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    attachments: [],
    credentialSubject: {
      achievement: {
        achievementType: "ext:LCA_CUSTOM:Social Badge",
        criteria: {
          narrative: badge.narrative
        },
        description: badge.description,
        id: `urn:uuid:${crypto.randomUUID()}`,
        image: badge.image,
        name: badge.name,
        type: ["Achievement"]
      },
      id: "did:placeholder",
      type: ["AchievementSubject"]
    },
    display: {
      backgroundColor: badge.color,
      backgroundImage: "",
      displayType: "badge",
      emoji: {
        activeSkinTone: "",
        imageUrl: "",
        names: [badge.name],
        unified: badge.icon,
        unifiedWithoutSkinTone: badge.icon
      }
    },
    groupID: "",
    id: `urn:uuid:${crypto.randomUUID()}`,
    image: badge.image,
    issuer: issuerDid,
    name: badge.name,
    type: ["VerifiableCredential", "OpenBadgeCredential", "BoostCredential"]
  };
}

