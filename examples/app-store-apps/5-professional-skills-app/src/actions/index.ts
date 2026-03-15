import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Professional skills credential definitions
const CREDENTIAL_DEFINITIONS = {
  professionalCertification: {
    id: 'professionalCertification',
    name: 'Professional Certification',
    type: 'ProfessionalCertificationCredential',
    icon: '🏆',
    color: '#1e40af',
    description: 'Official professional certification for workplace skills and competencies.',
    achievementType: 'ext:LCA_CUSTOM:ProfessionalCertification',
  },
  skillBadge: {
    id: 'skillBadge',
    name: 'Skill Assessment Badge',
    type: 'SkillBadgeCredential',
    icon: '🎯',
    color: '#059669',
    description: 'Digital badge recognizing demonstrated skill proficiency.',
    achievementType: 'ext:LCA_CUSTOM:SkillBadge',
  },
  continuingEducation: {
    id: 'continuingEducation',
    name: 'Continuing Education Credit',
    type: 'ContinuingEducationCredential',
    icon: '📚',
    color: '#7c3aed',
    description: 'Continuing education credits for professional development.',
    achievementType: 'ext:LCA_CUSTOM:ContinuingEducation',
  },
  professionalDevelopment: {
    id: 'professionalDevelopment',
    name: 'Professional Development',
    type: 'ProfessionalDevelopmentCredential',
    icon: '📈',
    color: '#dc2626',
    description: 'Track professional development achievements and milestones.',
    achievementType: 'ext:LCA_CUSTOM:ProfessionalDevelopment',
  },
};

const ensureIssuerProfileExists = async (learnCard: any) => {
  const profile = await learnCard.invoke.getProfile();
  if (!profile) {
    await learnCard.invoke.createProfile({
      profileId: 'professional-skills-issuer',
      displayName: 'Professional Skills Certification Issuer',
      description: 'Official issuer of workplace certifications and professional skill badges',
    });
  }
};

export const server = {
  // Issue a professional certification
  issueProfessionalCertification: defineAction({
    input: z.object({
      recipientDid: z.string(),
      professionalName: z.string(),
      certificationName: z.string(),
      issuingOrganization: z.string(),
      issueDate: z.string(),
      expirationDate: z.string().optional(),
      certificationLevel: z.string().optional(),
      credentialId: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.professionalCertification;
        
        const credential = {
          '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.2.json',
            'https://w3id.org/security/suites/ed25519-2020/v1'
          ],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ['VerifiableCredential', 'OpenBadgeCredential', def.type],
          issuer: issuerDid,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: input.recipientDid,
            type: ['AchievementSubject'],
            name: input.professionalName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: input.certificationName,
              description: `${input.certificationName} certified by ${input.issuingOrganization}`,
              criteria: {
                narrative: `${input.professionalName} has successfully earned the ${input.certificationName}${input.certificationLevel ? ` (${input.certificationLevel})` : ''} from ${input.issuingOrganization}. Issued on ${input.issueDate}${input.expirationDate ? `. Valid through: ${input.expirationDate}` : ''}${input.credentialId ? `. Credential ID: ${input.credentialId}` : ''}.`
              },
            }
          },
          display: {
            backgroundColor: def.color,
            displayType: 'badge',
            emoji: {
              unified: def.icon,
              unifiedWithoutSkinTone: def.icon,
              names: [def.name],
            }
          }
        };
        
        const signed = await learnCard.invoke.issueCredential(credential);
        const sent = await learnCard.invoke.sendCredential(input.recipientDid, signed);
        
        return {
          success: true,
          credentialId: credential.id,
          credential: signed,
        };
      } catch (error) {
        console.error('Error issuing professional certification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a skill badge
  issueSkillBadge: defineAction({
    input: z.object({
      recipientDid: z.string(),
      professionalName: z.string(),
      skillName: z.string(),
      skillCategory: z.string(),
      assessmentOrganization: z.string(),
      assessmentDate: z.string(),
      proficiencyLevel: z.string().optional(),
      assessmentScore: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.skillBadge;
        
        const credential = {
          '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.2.json',
            'https://w3id.org/security/suites/ed25519-2020/v1'
          ],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ['VerifiableCredential', 'OpenBadgeCredential', def.type],
          issuer: issuerDid,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: input.recipientDid,
            type: ['AchievementSubject'],
            name: input.professionalName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.skillName}`,
              description: `${input.skillName} - ${input.skillCategory} skill verified by ${input.assessmentOrganization}`,
              criteria: {
                narrative: `${input.professionalName} has demonstrated proficiency in ${input.skillName} (${input.skillCategory}) as assessed by ${input.assessmentOrganization} on ${input.assessmentDate}${input.proficiencyLevel ? `. Proficiency Level: ${input.proficiencyLevel}` : ''}${input.assessmentScore ? `. Assessment Score: ${input.assessmentScore}` : ''}.`
              },
            }
          },
          display: {
            backgroundColor: def.color,
            displayType: 'badge',
            emoji: {
              unified: def.icon,
              unifiedWithoutSkinTone: def.icon,
              names: [def.name],
            }
          }
        };
        
        const signed = await learnCard.invoke.issueCredential(credential);
        const sent = await learnCard.invoke.sendCredential(input.recipientDid, signed);
        
        return {
          success: true,
          credentialId: credential.id,
          credential: signed,
        };
      } catch (error) {
        console.error('Error issuing skill badge:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a continuing education credit
  issueContinuingEducation: defineAction({
    input: z.object({
      recipientDid: z.string(),
      professionalName: z.string(),
      courseTitle: z.string(),
      providerOrganization: z.string(),
      completionDate: z.string(),
      creditHours: z.number(),
      creditType: z.string().optional(),
      subjectArea: z.string().optional(),
      accreditationBody: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.continuingEducation;
        
        const credential = {
          '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.2.json',
            'https://w3id.org/security/suites/ed25519-2020/v1'
          ],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ['VerifiableCredential', 'OpenBadgeCredential', def.type],
          issuer: issuerDid,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: input.recipientDid,
            type: ['AchievementSubject'],
            name: input.professionalName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: input.courseTitle,
              description: `${input.creditHours} CE credit hours for ${input.courseTitle}`,
              criteria: {
                narrative: `${input.professionalName} has completed ${input.courseTitle} offered by ${input.providerOrganization}, earning ${input.creditHours} continuing education credit hours${input.creditType ? ` (${input.creditType})` : ''}. Completed on ${input.completionDate}${input.subjectArea ? `. Subject Area: ${input.subjectArea}` : ''}${input.accreditationBody ? `. Accredited by: ${input.accreditationBody}` : ''}.`
              },
            }
          },
          display: {
            backgroundColor: def.color,
            displayType: 'badge',
            emoji: {
              unified: def.icon,
              unifiedWithoutSkinTone: def.icon,
              names: [def.name],
            }
          }
        };
        
        const signed = await learnCard.invoke.issueCredential(credential);
        const sent = await learnCard.invoke.sendCredential(input.recipientDid, signed);
        
        return {
          success: true,
          credentialId: credential.id,
          credential: signed,
        };
      } catch (error) {
        console.error('Error issuing continuing education credit:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a professional development record
  issueProfessionalDevelopment: defineAction({
    input: z.object({
      recipientDid: z.string(),
      professionalName: z.string(),
      developmentTitle: z.string(),
      organization: z.string(),
      completionDate: z.string(),
      developmentType: z.string(),
      hoursCompleted: z.number().optional(),
      keyCompetencies: z.array(z.string()).optional(),
      nextSteps: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.professionalDevelopment;
        
        const competenciesList = input.keyCompetencies?.join(', ') || '';
        
        const credential = {
          '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.2.json',
            'https://w3id.org/security/suites/ed25519-2020/v1'
          ],
          id: `urn:uuid:${crypto.randomUUID()}`,
          type: ['VerifiableCredential', 'OpenBadgeCredential', def.type],
          issuer: issuerDid,
          issuanceDate: new Date().toISOString(),
          credentialSubject: {
            id: input.recipientDid,
            type: ['AchievementSubject'],
            name: input.professionalName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: input.developmentTitle,
              description: `Professional development: ${input.developmentTitle}`,
              criteria: {
                narrative: `${input.professionalName} has completed ${input.developmentTitle} through ${input.organization}. Activity Type: ${input.developmentType}. Completed: ${input.completionDate}${input.hoursCompleted ? `. Hours: ${input.hoursCompleted}` : ''}${competenciesList ? `. Key Competencies Developed: ${competenciesList}` : ''}${input.nextSteps ? `. Recommended Next Steps: ${input.nextSteps}` : ''}.`
              },
            }
          },
          display: {
            backgroundColor: def.color,
            displayType: 'badge',
            emoji: {
              unified: def.icon,
              unifiedWithoutSkinTone: def.icon,
              names: [def.name],
            }
          }
        };
        
        const signed = await learnCard.invoke.issueCredential(credential);
        const sent = await learnCard.invoke.sendCredential(input.recipientDid, signed);
        
        return {
          success: true,
          credentialId: credential.id,
          credential: signed,
        };
      } catch (error) {
        console.error('Error issuing professional development record:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
};
