import { UnsignedVC, UnsignedAchievementCredential } from '@learncard/types';

import { VcTemplates } from './types';

/** @group VC Templates Plugin */
export const VC_TEMPLATES: {
    [Key in keyof VcTemplates]: (args: VcTemplates[Key], crypto: Crypto) => UnsignedVC;
} = {
    basic: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {},
        crypto
    ) => ({
        '@context': ['https://www.w3.org/ns/credentials/v2'],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential'],
        issuer: did,
        validFrom: issuanceDate,
        credentialSubject: { id: subject },
    }),
    achievement: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            name = 'Teamwork Badge',
            achievementName = 'Teamwork',
            description = 'This badge recognizes the development of the capacity to collaborate within a group environment.',
            criteriaNarrative = 'Team members are nominated for this badge by their peers and recognized upon review by Example Corp management.',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {},
        crypto
    ): UnsignedAchievementCredential => ({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: { id: did },
        validFrom: issuanceDate,
        name,
        credentialSubject: {
            id: subject,
            type: ['AchievementSubject'],
            achievement: {
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                criteria: { narrative: criteriaNarrative },
                description,
                name: achievementName,
            },
        },
    }),
    jff2: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
        } = {},
        crypto
    ) => ({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'JFF x vc-edu PlugFest 2 Interoperability',
        issuer: {
            type: ['Profile'],
            id: did,
            name: 'Jobs for the Future (JFF)',
            image: {
                id: 'https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png',
                type: 'Image',
            },
        },
        issuanceDate: issuanceDate,
        credentialSubject: {
            type: ['AchievementSubject'],
            id: subject,
            achievement: {
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                name: 'JFF x vc-edu PlugFest 2 Interoperability',
                description:
                    'This credential solution supports the use of OBv3 and w3c Verifiable Credentials and is interoperable with at least two other solutions.  This was demonstrated successfully during JFF x vc-edu PlugFest 2.',
                criteria: {
                    narrative:
                        'Solutions providers earned this badge by demonstrating interoperability between multiple providers based on the OBv3 candidate final standard, with some additional required fields. Credential issuers earning this badge successfully issued a credential into at least two wallets.  Wallet implementers earning this badge successfully displayed credentials issued by at least two different credential issuers.',
                },
                image: {
                    id: 'https://w3c-ccg.github.io/vc-ed/plugfest-2-2022/images/JFF-VC-EDU-PLUGFEST2-badge-image.png',
                    type: 'Image',
                },
            },
        },
    }),
    boost: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
            expirationDate,
            boostName = 'Example Boost',
            boostImage,
            achievementId,
            achievementType = 'Influencer',
            achievementName = 'Awesome Badge',
            achievementDescription = 'Awesome People Earn Awesome Badge',
            achievementNarrative = 'Earned by being awesome.',
            achievementImage = '',
            attachments,
            display,
            familyTitles,
            skills,
            network,
            groupID = '',
        } = {},
        crypto
    ) => ({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.1.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
        id: `urn:uuid:${crypto.randomUUID()}`,
        issuer: { id: did },
        validFrom: issuanceDate,
        ...(expirationDate && { validUntil: expirationDate }),
        name: boostName,
        credentialSubject: {
            id: subject,
            type: ['AchievementSubject'],
            achievement: {
                id: achievementId ?? `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                achievementType: achievementType,
                name: achievementName,
                description: achievementDescription,
                image: achievementImage,
                criteria: {
                    narrative: achievementNarrative,
                },
            },
        },
        display,
        familyTitles,
        image: boostImage,
        attachments,
        skills,
        ...(network ? { network } : {}),
        groupID,
    }),
    boostID: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = '2020-08-19T21:41:50Z',
            expirationDate,
            boostName = 'Example Boost',
            boostImage,
            achievementId,
            achievementType = 'Influencer',
            achievementName = 'Awesome Badge',
            achievementDescription = 'Awesome People Earn Awesome Badge',
            achievementNarrative = 'Earned by being awesome.',
            achievementImage = '',
            address,
            attachments,
            skills,
            display,
            familyTitles,
            boostID,
            network,
            groupID = '',
        } = {},
        crypto
    ) => ({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            'https://ctx.learncard.com/boosts/1.0.1.json',
            'https://ctx.learncard.com/boostIDs/1.0.0.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential', 'BoostID'],
        id: `urn:uuid:${crypto.randomUUID()}`,
        issuer: { id: did },
        validFrom: issuanceDate,
        ...(expirationDate && { validUntil: expirationDate }),
        name: boostName,
        credentialSubject: {
            id: subject,
            type: ['AchievementSubject'],
            achievement: {
                id: achievementId ?? `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                achievementType: achievementType,
                name: achievementName,
                description: achievementDescription,
                image: achievementImage,
                criteria: {
                    narrative: achievementNarrative,
                },
            },
        },
        ...(address
            ? {
                address: {
                    type: ['Address'],
                    ...address,
                    ...(address.geo ? { geo: { type: ['GeoCoordinates'], ...address.geo } } : {}),
                },
            }
            : {}),
        display,
        familyTitles,
        image: boostImage,
        attachments,
        skills,
        boostID,
        ...(network ? { network } : {}),
        groupID,
    }),
    delegate: (
        {
            did = 'did:example:d23dd687a7dc6787646f2eb98d0',
            subject = 'did:example:d23dd687a7dc6787646f2eb98d0',
            issuanceDate = new Date().toISOString(),
            access = ['read'],
        } = {},
        crypto
    ) => ({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://ctx.learncard.com/delegates/1.0.0.json',
        ],
        type: ['VerifiableCredential', 'DelegateCredential'],
        id: `urn:uuid:${crypto.randomUUID()}`,
        issuer: { id: did },
        validFrom: issuanceDate,
        credentialSubject: { id: subject },
        permissions: { statementAccess: access },
    }),
};
