import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

export const server = {
  issueCredential: defineAction({
    input: z.object({
      recipientDid: z.string(),
    }),
    handler: async (input) => {
      const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
      const achievementCredential = learnCard.invoke.newCredential({ type: 'achievement' });

      if (achievementCredential.credentialSubject) {
        achievementCredential.credentialSubject = { 
          ...achievementCredential.credentialSubject, 
          id: input.recipientDid 
        };
      }

      const achievementId = 'urn:uuid:' + crypto.randomUUID();
      achievementCredential.id = achievementId;
      achievementCredential.issuer = learnCard.id.did();

      const signedCredential = await learnCard.invoke.issueCredential(achievementCredential);
      return signedCredential;
    }
  })
};
