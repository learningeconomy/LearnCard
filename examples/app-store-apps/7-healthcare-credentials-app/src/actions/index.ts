import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Healthcare credential definitions
const CREDENTIAL_DEFINITIONS = {
  medicalLicense: {
    id: 'medicalLicense',
    name: 'Medical License',
    type: 'MedicalLicenseCredential',
    icon: '🏥',
    color: '#dc2626',
    description: 'Official medical license credential for healthcare professionals.',
    achievementType: 'ext:LCA_CUSTOM:MedicalLicense',
  },
  trainingCertification: {
    id: 'trainingCertification',
    name: 'Medical Training Certification',
    type: 'MedicalTrainingCredential',
    icon: '🎓',
    color: '#059669',
    description: 'Certification for completed medical training programs.',
    achievementType: 'ext:LCA_CUSTOM:MedicalTraining',
  },
  providerCredential: {
    id: 'providerCredential',
    name: 'Healthcare Provider Credential',
    type: 'HealthcareProviderCredential',
    icon: '👨‍⚕️',
    color: '#2563eb',
    description: 'Healthcare provider identification and employment credential.',
    achievementType: 'ext:LCA_CUSTOM:HealthcareProvider',
  },
  patientEducation: {
    id: 'patientEducation',
    name: 'Patient Education Certificate',
    type: 'PatientEducationCredential',
    icon: '📚',
    color: '#7c3aed',
    description: 'Certificate for completed patient education programs.',
    achievementType: 'ext:LCA_CUSTOM:PatientEducation',
  },
};

const ensureIssuerProfileExists = async (learnCard: any) => {
  const profile = await learnCard.invoke.getProfile();
  if (!profile) {
    await learnCard.invoke.createProfile({
      profileId: 'healthcare-credentials-issuer',
      displayName: 'Healthcare Credentials Issuer',
      description: 'Official issuer of healthcare professional credentials',
    });
  }
};

export const server = {
  // Issue a medical license credential
  issueMedicalLicense: defineAction({
    input: z.object({
      recipientDid: z.string(),
      providerName: z.string(),
      licenseType: z.string(),
      licenseNumber: z.string(),
      issuingBoard: z.string(),
      issueDate: z.string(),
      expirationDate: z.string(),
      specialties: z.string().optional(),
      restrictions: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.medicalLicense;
        
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
            name: input.providerName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.licenseType} License`,
              description: `Medical license issued by ${input.issuingBoard}`,
              criteria: {
                narrative: `License Type: ${input.licenseType}\nLicense Number: ${input.licenseNumber}\nIssued By: ${input.issuingBoard}\nIssue Date: ${input.issueDate}\nExpiration Date: ${input.expirationDate}${input.specialties ? `\nSpecialties: ${input.specialties}` : ''}${input.restrictions ? `\nRestrictions: ${input.restrictions}` : ''}`
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
        console.error('Error issuing medical license:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a medical training certification
  issueTrainingCertification: defineAction({
    input: z.object({
      recipientDid: z.string(),
      providerName: z.string(),
      programName: z.string(),
      certificationType: z.string(),
      trainingInstitution: z.string(),
      completionDate: z.string(),
      expirationDate: z.string().optional(),
      trainingHours: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.trainingCertification;
        
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
            name: input.providerName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.programName}`,
              description: `${input.certificationType} certification from ${input.trainingInstitution}`,
              criteria: {
                narrative: `${input.providerName} has successfully completed the ${input.programName} program.${input.trainingHours ? ` Training Hours: ${input.trainingHours}.` : ''}\n\nCertification Type: ${input.certificationType}\nInstitution: ${input.trainingInstitution}\nCompletion Date: ${input.completionDate}${input.expirationDate ? `\nValid Until: ${input.expirationDate}` : ''}`
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
        console.error('Error issuing training certification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a healthcare provider credential
  issueProviderCredential: defineAction({
    input: z.object({
      recipientDid: z.string(),
      providerName: z.string(),
      providerId: z.string(),
      facility: z.string(),
      department: z.string(),
      role: z.string(),
      issueDate: z.string(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.providerCredential;
        
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
            name: input.providerName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.facility} - ${input.role}`,
              description: `Healthcare provider credential`,
              criteria: {
                narrative: `Provider: ${input.providerName}\nProvider ID: ${input.providerId}\nFacility: ${input.facility}\nDepartment: ${input.department}\nRole: ${input.role}\nIssue Date: ${input.issueDate}`
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
        console.error('Error issuing provider credential:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a patient education certificate
  issuePatientEducation: defineAction({
    input: z.object({
      recipientDid: z.string(),
      patientName: z.string(),
      programName: z.string(),
      topicsCovered: z.string(),
      completionDate: z.string(),
      provider: z.string(),
      facility: z.string(),
      validityPeriod: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.patientEducation;
        
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
            name: input.patientName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.programName}`,
              description: `Patient education completion certificate`,
              criteria: {
                narrative: `Patient: ${input.patientName}\n\nProgram: ${input.programName}\nTopics Covered: ${input.topicsCovered}\n\nCompletion Date: ${input.completionDate}${input.validityPeriod ? `\nValid For: ${input.validityPeriod}` : ''}\n\nProvider: ${input.provider}\nFacility: ${input.facility}`
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
        console.error('Error issuing patient education certificate:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
};
