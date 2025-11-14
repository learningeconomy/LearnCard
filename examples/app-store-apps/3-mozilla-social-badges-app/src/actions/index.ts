import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Mozilla Social Badge Definitions
const BADGE_DEFINITIONS = [
  {
    id: 'firefox-champion',
    name: 'Firefox Champion',
    icon: '🦊',
    color: '#FF6611',
    description: 'Advocates for browser choice, privacy, and an open web',
    narrative: 'Earn this badge by actively promoting browser choice, privacy rights, and open web standards. Champions Firefox and Mozilla\'s mission for a healthier internet.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'open-web-builder',
    name: 'Open Web Builder',
    icon: '🌐',
    color: '#0060DF',
    description: 'Contributes to open web standards and technologies',
    narrative: 'Earn this badge by making significant contributions to open web standards, specifications, or technologies that advance the open internet ecosystem.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'privacy-guardian',
    name: 'Privacy Guardian',
    icon: '🛡️',
    color: '#592ACB',
    description: 'Champions privacy, security, and data protection',
    narrative: 'Earn this badge by demonstrating commitment to user privacy, security best practices, and advocating for strong data protection measures online.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'mdn-contributor',
    name: 'MDN Contributor',
    icon: '📚',
    color: '#00B3A4',
    description: 'Improves web documentation and learning resources',
    narrative: 'Earn this badge by contributing to MDN Web Docs, helping improve documentation, tutorials, and learning resources for web developers worldwide.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'community-leader',
    name: 'Community Leader',
    icon: '🤝',
    color: '#FF298A',
    description: 'Builds and nurtures Mozilla communities worldwide',
    narrative: 'Earn this badge by actively building, supporting, and nurturing Mozilla communities. Demonstrates leadership in organizing events, mentoring others, and fostering collaboration.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  },
  {
    id: 'design-pioneer',
    name: 'Design Pioneer',
    icon: '🎨',
    color: '#20123A',
    description: 'Creates beautiful, accessible web experiences',
    narrative: 'Earn this badge by creating exceptional, accessible web designs that prioritize user experience and inclusive design principles aligned with Mozilla\'s values.',
    image: 'https://cdn.filestackcontent.com/resize=width:400,height:400,fit:crop/KCEJO5PlQSCtZOSytMgt'
  }
];

const ensureLearnCardIssuerProfileExists = async (learnCard: LearnCard) => {
  const issuerProfile = await learnCard.invoke.getProfile();

  if (!issuerProfile) {
    await learnCard.invoke.createProfile({
      profileId: 'mozilla-social-badges-issuer',
      displayName: 'Mozilla Social Badges',
      description: 'Issuer of Mozilla Social Badge boost templates',
    });
  }
};

export const server = {
  getBoostTemplates: defineAction({
    handler: async () => {
      try {
        console.log('🦊 Initializing LearnCard for Mozilla Social Badges...');

        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });

        await ensureLearnCardIssuerProfileExists(learnCard);

        const issuerDid = learnCard.id.did();

        console.log('📋 Loading Mozilla Social Badge templates...');

        // Get existing boosts created by this issuer
        const existingBoosts = await learnCard.invoke.getPaginatedBoosts({
          limit: 100,
        });

        console.log(`✓ Found ${existingBoosts.records.length} existing boosts`);

        const boostTemplates = [];

        // Process each badge definition
        for (const badge of BADGE_DEFINITIONS) {
          // Check if boost already exists for this badge
          const existingBoost = existingBoosts.records.find(
            (boost) => boost.name === badge.name
          );

          if (existingBoost && existingBoost.uri) {
            console.log(`✓ Boost already exists for ${badge.name}: ${existingBoost.uri}`);
            boostTemplates.push({
              ...badge,
              uri: existingBoost.uri,
            });
          } else {
            // Create new boost
            console.log(`⚙️ Creating boost for ${badge.name}...`);
            
            try {
              const credential = createCredentialTemplate(badge, issuerDid);
              const boostUri = await learnCard.invoke.createBoost(credential, {
                name: badge.name,
                category: 'Social Badge',
              });

              console.log(`✅ Created boost for ${badge.name}: ${boostUri}`);

              boostTemplates.push({
                ...badge,
                uri: boostUri,
              });
            } catch (error) {
              console.error(`❌ Error creating boost for ${badge.name}:`, error);
              // Continue with other badges even if one fails
            }
          }
        }

        return {
          boostTemplates,
          success: true,
        };
      } catch (error) {
        console.error('❌ Error in getBoostTemplates:', error);
        return {
          boostTemplates: [],
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
        console.log(`🔑 Assigning admin access to ${input.profileId}...`);

        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureLearnCardIssuerProfileExists(learnCard);

        const boostTemplates = await learnCard.invoke.getPaginatedBoosts({
          limit: 100,
        });

        let successCount = 0;
        for (const boostTemplate of boostTemplates.records) {
          try {
            const addAdminSuccess = await learnCard.invoke.addBoostAdmin(
              boostTemplate.uri,
              input.profileId
            );
            if (addAdminSuccess) {
              successCount++;
              console.log(`✓ Added ${input.profileId} as admin to ${boostTemplate.name}`);
            }
          } catch (error) {
            console.error(`❌ Error adding admin to ${boostTemplate.name}:`, error);
          }
        }
      
        return {
          success: successCount > 0,
          count: successCount,
        };
      } catch (error) {
        console.error('❌ Error in assignAdminToBoostTemplates:', error);
        return {
          success: false,
          count: 0,
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
        console.error('❌ Error in getBoostRecipients:', error);
        return {
          recipients: [],
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  })
};

// Helper function to create a credential template for a Mozilla Social Badge
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
        achievementType: "ext:LCA_CUSTOM:Mozilla Social Badge",
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
