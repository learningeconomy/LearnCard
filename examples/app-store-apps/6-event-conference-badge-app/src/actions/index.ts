import { defineAction } from 'astro:actions';
import { initLearnCard } from '@learncard/init';
import crypto from 'node:crypto';
import { z } from 'astro:schema';

// Load issuer seed from environment variable
const issuerSeed = import.meta.env.LEARNCARD_ISSUER_SEED;

if (!issuerSeed) {
  throw new Error('LEARNCARD_ISSUER_SEED environment variable is required');
}

// Event credential definitions
const CREDENTIAL_DEFINITIONS = {
  attendance: {
    id: 'attendance',
    name: 'Event Attendance',
    type: 'EventAttendanceCredential',
    icon: '🎫',
    color: '#0ea5e9',
    description: 'Verifiable credential confirming attendance at an event or conference.',
    achievementType: 'ext:LCA_CUSTOM:EventAttendance',
  },
  speaker: {
    id: 'speaker',
    name: 'Speaker Credential',
    type: 'SpeakerCredential',
    icon: '🎤',
    color: '#8b5cf6',
    description: 'Speaker credential with bio and session details for conference presenters.',
    achievementType: 'ext:LCA_CUSTOM:Speaker',
  },
  workshop: {
    id: 'workshop',
    name: 'Workshop Certificate',
    type: 'WorkshopCredential',
    icon: '🛠️',
    color: '#f59e0b',
    description: 'Certificate of participation for workshop attendance.',
    achievementType: 'ext:LCA_CUSTOM:Workshop',
  },
  networking: {
    id: 'networking',
    name: 'Networking Contact',
    type: 'NetworkingCredential',
    icon: '🤝',
    color: '#10b981',
    description: 'Professional contact exchange credential for networking.',
    achievementType: 'ext:LCA_CUSTOM:Networking',
  },
  session: {
    id: 'session',
    name: 'Session Check-in',
    type: 'SessionAttendanceCredential',
    icon: '📍',
    color: '#ef4444',
    description: 'Session-specific attendance verification with timestamp.',
    achievementType: 'ext:LCA_CUSTOM:SessionAttendance',
  },
};

const ensureIssuerProfileExists = async (learnCard: any) => {
  const profile = await learnCard.invoke.getProfile();
  if (!profile) {
    await learnCard.invoke.createProfile({
      profileId: 'event-conference-issuer',
      displayName: 'Event & Conference Issuer',
      description: 'Official issuer of event badges and conference credentials',
    });
  }
};

export const server = {
  // Issue an event attendance badge
  issueAttendanceBadge: defineAction({
    input: z.object({
      recipientDid: z.string(),
      attendeeName: z.string(),
      eventName: z.string(),
      eventDate: z.string(),
      ticketType: z.string(),
      organizerName: z.string(),
      location: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.attendance;
        
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
            name: input.attendeeName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.eventName} - Attendee`,
              description: `Attendance credential for ${input.eventName}`,
              criteria: {
                narrative: `${input.attendeeName} attended ${input.eventName} on ${input.eventDate}. Ticket type: ${input.ticketType}. Organized by ${input.organizerName}${input.location ? ` in ${input.location}` : ''}.`
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
        console.error('Error issuing attendance badge:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a speaker credential
  issueSpeakerCredential: defineAction({
    input: z.object({
      recipientDid: z.string(),
      speakerName: z.string(),
      eventName: z.string(),
      sessionTitle: z.string(),
      bio: z.string(),
      expertise: z.string().optional(),
      sessionDate: z.string(),
      organizerName: z.string(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.speaker;
        
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
            name: input.speakerName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.eventName} - Speaker`,
              description: `Speaker credential for ${input.sessionTitle}`,
              criteria: {
                narrative: `Speaker: ${input.speakerName}\n\nBio: ${input.bio}${input.expertise ? `\n\nExpertise: ${input.expertise}` : ''}\n\nPresented "${input.sessionTitle}" at ${input.eventName} on ${input.sessionDate}. Official speaker credential issued by ${input.organizerName}.`
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
        console.error('Error issuing speaker credential:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a workshop certificate
  issueWorkshopCertificate: defineAction({
    input: z.object({
      recipientDid: z.string(),
      participantName: z.string(),
      workshopTitle: z.string(),
      workshopDescription: z.string(),
      instructorName: z.string(),
      completionDate: z.string(),
      skills: z.string().optional(),
      duration: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.workshop;
        
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
            name: input.participantName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.workshopTitle}`,
              description: `${input.workshopDescription}`,
              criteria: {
                narrative: `${input.participantName} successfully completed the workshop "${input.workshopTitle}"${input.duration ? ` (${input.duration})` : ''}.\n\nDescription: ${input.workshopDescription}\n\nInstructor: ${input.instructorName}\n\nCompleted: ${input.completionDate}${input.skills ? `\n\nSkills Acquired: ${input.skills}` : ''}`
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
        console.error('Error issuing workshop certificate:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a networking credential
  issueNetworkingCredential: defineAction({
    input: z.object({
      recipientDid: z.string(),
      contactName: z.string(),
      professionalTitle: z.string(),
      company: z.string(),
      eventName: z.string(),
      exchangeDate: z.string(),
      contactInfo: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.networking;
        
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
            name: input.contactName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `Network Contact - ${input.contactName}`,
              description: `Professional contact exchanged at ${input.eventName}`,
              criteria: {
                narrative: `Contact: ${input.contactName}\nTitle: ${input.professionalTitle}\nCompany: ${input.company}\n\nExchanged at ${input.eventName} on ${input.exchangeDate}.${input.contactInfo ? `\n\nContact Info: ${input.contactInfo}` : ''}${input.notes ? `\n\nNotes: ${input.notes}` : ''}`
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
        console.error('Error issuing networking credential:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),

  // Issue a session check-in credential
  issueSessionCheckin: defineAction({
    input: z.object({
      recipientDid: z.string(),
      attendeeName: z.string(),
      sessionName: z.string(),
      eventName: z.string(),
      sessionTime: z.string(),
      location: z.string().optional(),
      speaker: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        const learnCard = await initLearnCard({ seed: issuerSeed, network: true });
        await ensureIssuerProfileExists(learnCard);
        
        const issuerDid = learnCard.id.did();
        const def = CREDENTIAL_DEFINITIONS.session;
        const checkInTime = new Date().toISOString();
        
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
          issuanceDate: checkInTime,
          credentialSubject: {
            id: input.recipientDid,
            type: ['AchievementSubject'],
            name: input.attendeeName,
            achievement: {
              id: `urn:uuid:${crypto.randomUUID()}`,
              type: ['Achievement'],
              achievementType: def.achievementType,
              name: `${input.eventName} - ${input.sessionName}`,
              description: `Session attendance verification`,
              criteria: {
                narrative: `${input.attendeeName} attended "${input.sessionName}" at ${input.eventName}.\n\nScheduled: ${input.sessionTime}${input.location ? `\nLocation: ${input.location}` : ''}${input.speaker ? `\nSpeaker: ${input.speaker}` : ''}\n\nChecked in at: ${checkInTime}`
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
        console.error('Error issuing session check-in:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }),
};
