import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Academic credential definitions
const CREDENTIAL_DEFINITIONS = {
  diploma: {
    id: 'diploma',
    name: 'Diploma',
    type: 'DiplomaCredential',
    icon: '🎓',
    color: '#1e3a8a',
    description: 'Official diploma credential representing completion of a degree program.',
    achievementType: 'ext:LCA_CUSTOM:Diploma',
  },
  courseCertificate: {
    id: 'courseCertificate',
    name: 'Course Certificate',
    type: 'CourseCertificateCredential',
    icon: '📜',
    color: '#059669',
    description: 'Certificate of completion for individual courses and training programs.',
    achievementType: 'ext:LCA_CUSTOM:CourseCertificate',
  },
  studentId: {
    id: 'studentId',
    name: 'Student ID Card',
    type: 'StudentIDCredential',
    icon: '🪪',
    color: '#7c3aed',
    description: 'Digital student identification card for campus access and verification.',
    achievementType: 'ext:LCA_CUSTOM:StudentID',
  },
  transcript: {
    id: 'transcript',
    name: 'Academic Transcript',
    type: 'TranscriptCredential',
    icon: '📊',
    color: '#dc2626',
    description: 'Official academic transcript showing courses taken and grades earned.',
    achievementType: 'ext:LCA_CUSTOM:Transcript',
  },
};

const ensureIssuerProfileExists = async (learnCard: any) => {
  const profile = await learnCard.invoke.getProfile();
  if (!profile) {
    await learnCard.invoke.createProfile({
      profileId: 'academic-credentials-issuer',
      displayName: 'Academic Credentials Issuer',
      description: 'Official issuer of academic credentials and certificates',
    });
  }
};

export const server = {
  // Issue a diploma credential
  issueDiploma: defineAction({
    input: z.object({
      recipientDid: z.string(),
      studentName: z.string(),
      degreeName: z.string(),
      institution: z.string(),
      graduationDate: z.string(),
      major: z.string().optional(),
      honors: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.diploma;
        
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
            name: input.studentName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.degreeName}`,
              description: `${input.degreeName} awarded by ${input.institution}`,
              criteria: {
                narrative: `Successfully completed all requirements for the ${input.degreeName}${input.major ? ` in ${input.major}` : ''} at ${input.institution}. Graduated on ${input.graduationDate}${input.honors ? ` with ${input.honors}` : ''}.`
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
        console.error('Error issuing diploma:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a course certificate
  issueCourseCertificate: defineAction({
    input: z.object({
      recipientDid: z.string(),
      studentName: z.string(),
      courseName: z.string(),
      institution: z.string(),
      completionDate: z.string(),
      instructor: z.string().optional(),
      grade: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.courseCertificate;
        
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
            name: input.studentName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.courseName}`,
              description: `Course completion certificate for ${input.courseName} offered by ${input.institution}`,
              criteria: {
                narrative: `Successfully completed ${input.courseName} at ${input.institution}${input.instructor ? ` under the instruction of ${input.instructor}` : ''}. Completed on ${input.completionDate}${input.grade ? ` with a grade of ${input.grade}` : ''}.`
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
        console.error('Error issuing course certificate:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a student ID card
  issueStudentId: defineAction({
    input: z.object({
      recipientDid: z.string(),
      studentName: z.string(),
      institution: z.string(),
      studentNumber: z.string(),
      enrollmentDate: z.string(),
      expirationDate: z.string().optional(),
      program: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.studentId;
        
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
            name: input.studentName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: 'Student Identification Card',
              description: `Official student ID for ${input.institution}`,
              criteria: {
                narrative: `Student ID for ${input.studentName} (ID: ${input.studentNumber}) enrolled at ${input.institution}${input.program ? ` in the ${input.program} program` : ''}. Enrolled: ${input.enrollmentDate}${input.expirationDate ? `. Valid through: ${input.expirationDate}` : ''}.`
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
        console.error('Error issuing student ID:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue an academic transcript
  issueTranscript: defineAction({
    input: z.object({
      recipientDid: z.string(),
      studentName: z.string(),
      institution: z.string(),
      program: z.string(),
      courses: z.array(z.object({
        name: z.string(),
        code: z.string(),
        credits: z.number(),
        grade: z.string(),
        semester: z.string(),
      })),
      cumulativeGpa: z.string(),
      issueDate: z.string(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.transcript;
        
        const courseList = input.courses.map(c => 
          `${c.code}: ${c.name} (${c.credits} cr) - Grade: ${c.grade} - ${c.semester}`
        ).join('\n');
        
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
            name: input.studentName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: 'Academic Transcript',
              description: `Official academic transcript for ${input.program} at ${input.institution}`,
              criteria: {
                narrative: `Academic Record for ${input.studentName}\n\nProgram: ${input.program}\nInstitution: ${input.institution}\n\nCourses:\n${courseList}\n\nCumulative GPA: ${input.cumulativeGpa}\n\nIssued: ${input.issueDate}`
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
        console.error('Error issuing transcript:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
};
