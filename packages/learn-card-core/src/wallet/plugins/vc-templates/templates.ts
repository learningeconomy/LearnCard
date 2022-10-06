import {
    UnsignedVC,
    UnsignedAchievementCredential,
    UnsignedMembershipCredential,
    UnsignedCourseCredential,
    UnsignedCompetencyCredential,
} from '@learncard/types';

import { VcTemplates } from './types';

/** @group VC Templates Plugin */
export const VC_TEMPLATES: { [Key in keyof VcTemplates]: (args: VcTemplates[Key]) => UnsignedVC } =
    {
        basic: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {}) => ({
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id: 'http://example.org/credentials/3731',
            type: ['VerifiableCredential'],
            issuer: did,
            issuanceDate,
            credentialSubject: { id: subject },
        }),
        achievement: ({
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            name = 'Teamwork Badge',
            achievementId = 'https://example.com/achievements/21st-century-skills/teamwork',
            achievementName = 'Teamwork',
            description = 'This badge recognizes the development of the capacity to collaborate within a group environment.',
            criteriaNarrative = 'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {}): UnsignedAchievementCredential => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://imsglobal.github.io/openbadges-specification/context.json',
            ],
            id: 'http://example.com/credentials/3527',
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer: did,
            issuanceDate,
            name,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    id: achievementId,
                    type: ['Achievement'],
                    criteria: { narrative: criteriaNarrative },
                    description,
                    name: achievementName,
                },
            },
        }),
        membership: ({
            credentialId = 'http://example.com/credentials/39732983',
            credentialName = 'Membership ID VC',
            issuer = 'did:key:z6MkrUgpxXhuNmVfdmHRX1xjdWRP32HRLeergsKnFy8xBd15',
            issuanceDate = '2010-01-01T00:00:00Z',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            achievementId = '#39732983',
            achievementName = 'Student Buckard ID',
            achievementNarrative = 'ID Card issued to every student of Example University.',
            achievementDescription = 'This ID represents membership with Example University.',
            achievementImage = 'https://example.com/achievements/robotics/robot-programming/image',
        } = {}): UnsignedMembershipCredential => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://imsglobal.github.io/openbadges-specification/context.json',
            ],
            id: credentialId,
            name: credentialName,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer,
            issuanceDate,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    type: ['Achievement'],
                    achievementType: 'Membership',
                    id: achievementId,
                    name: achievementName,
                    description: achievementDescription,
                    criteria: {
                        narrative: achievementNarrative,
                    },
                },
            },
        }),
        competency: ({
            credentialId = 'http://example.com/credentials/39732983',
            credentialName = 'Competency VC',
            issuer = 'did:key:z6MkrUgpxXhuNmVfdmHRX1xjdWRP32HRLeergsKnFy8xBd15',
            issuanceDate = '2010-01-01T00:00:00Z',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            achievementId = 'https://example.com/achievements/robotics/robot-programming',
            achievementName = 'Robot Programming',
            achievementNarrative = 'Learners must present source code showing the ability for a robot to accept manual or sensor input and perform conditional actions in response.',
            achievementDescription = 'This achievement represents developing capability to develop software for robotic applications.',
            achievementImage = 'https://example.com/achievements/robotics/robot-programming/image',
        } = {}): UnsignedCompetencyCredential => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://imsglobal.github.io/openbadges-specification/context.json',
            ],
            id: credentialId,
            name: credentialName,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer,
            issuanceDate,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    type: ['Achievement'],
                    achievementType: 'Competency',
                    id: achievementId,
                    name: achievementName,
                    description: achievementDescription,
                    criteria: {
                        narrative: achievementNarrative,
                    },
                    image: achievementImage,
                },
            },
        }),
        course: ({
            credentialId = 'http://example.com/credentials/39732983',
            credentialName = 'Course Completion VC',
            issuer = 'did:key:z6MkrUgpxXhuNmVfdmHRX1xjdWRP32HRLeergsKnFy8xBd15',
            issuanceDate = '2010-01-01T00:00:00Z',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            achievementId = 'https://example.com/courses/mech/1310',
            achievementName = 'MECH 1310: Electrical Components',
            achievementNarrative = 'The student successfully completed MECH 1310 with a passing grade.',
            achievementDescription = 'This course is a study of the basic electrical components in a mechatronics system.  Topics covered will include basic functions and physical properties of electrical components; the systematic flow of energy and measurement of components; troubleshooting techniques and strategies to identify, localize and correct malfunctions; and systematic preventive maintenance and electrical component safety.  Technical documentation such as data sheets, schematics, timing diagrams and system specifications will also be covered.',
            achievementImage = 'https://example.com/courses/mech/1310.png',
        } = {}): UnsignedCourseCredential => ({
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://imsglobal.github.io/openbadges-specification/context.json',
            ],
            id: credentialId,
            name: credentialName,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            issuer,
            issuanceDate,
            credentialSubject: {
                id: subject,
                type: ['AchievementSubject'],
                achievement: {
                    type: ['Achievement'],
                    achievementType: 'Course',
                    id: achievementId,
                    name: achievementName,
                    description: achievementDescription,
                    criteria: {
                        narrative: achievementNarrative,
                    },
                    image: achievementImage,
                },
            },
        }),
    };
