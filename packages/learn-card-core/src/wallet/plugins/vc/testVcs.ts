import { UnsignedVC, UnsignedAchievementCredential } from '@learncard/types';

export const getBasicVc = ({
    did = 'did:example:d23dd687a7dc6787646f2eb98d0',
    subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
}: {
    did?: string;
    subject?: string;
}): UnsignedVC => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'http://example.org/credentials/3731',
    type: ['VerifiableCredential'],
    issuer: did,
    issuanceDate: '2020-08-19T21:41:50Z',
    credentialSubject: { id: subject },
});

export const getAchievementCredential = ({
    did = 'did:example:d23dd687a7dc6787646f2eb98d0',
    subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
    name = 'Teamwork Badge',
    achievementName = 'Teamwork',
    description = 'This badge recognizes the development of the capacity to collaborate within a group environment.',
    criteriaNarrative = 'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
}: {
    did?: string;
    subject?: string;
    name?: string;
    achievementName?: string;
    description?: string;
    criteriaNarrative?: string;
}): UnsignedAchievementCredential => ({
    '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://imsglobal.github.io/openbadges-specification/context.json',
    ],
    id: 'http://example.com/credentials/3527',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: did,
    issuanceDate: '2010-01-01T00:00:00Z',
    name,
    credentialSubject: {
        id: subject,
        type: ['AchievementSubject'],
        achievement: {
            id: 'https://example.com/achievements/21st-century-skills/teamwork',
            type: ['Achievement'],
            criteria: { narrative: criteriaNarrative },
            description,
            name: achievementName,
        },
    },
});
