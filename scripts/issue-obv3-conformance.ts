import { initLearnCard } from '@learncard/init';
import { ConformantAchievementCredentialValidator, type UnsignedVC } from '@learncard/types';

const CONFORMANCE_RECIPIENT = 'conformance@imsglobal.org';

const SPEC_REQUIRED_ROOT = [
    '@context',
    'id',
    'type',
    'credentialSubject',
    'issuer',
    'validFrom',
] as const;

const SPEC_REQUIRED_ACHIEVEMENT = ['id', 'type', 'criteria', 'description', 'name'] as const;

const run = async () => {
    const seed = process.env.CONFORMANCE_SEED ?? 'c0ffee'.padEnd(64, '0');
    const learnCard = await initLearnCard({ seed });
    const did = learnCard.id.did();

    const now = new Date().toISOString();

    const unsigned = {
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        id: `urn:uuid:${crypto.randomUUID()}`,
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'LearnCard Open Badges 3.0 Conformance Badge',
        description:
            'Awarded to demonstrate that LearnCard issues Open Badges 3.0 conformant credentials.',
        issuer: {
            id: did,
            type: ['Profile'],
            name: 'Learning Economy Foundation',
            url: 'https://www.learningeconomy.io',
        },
        validFrom: now,
        awardedDate: now,
        credentialSubject: {
            type: ['AchievementSubject'],
            identifier: [
                {
                    type: 'IdentityObject',
                    hashed: false,
                    identityHash: CONFORMANCE_RECIPIENT,
                    identityType: 'emailAddress',
                },
            ],
            achievement: {
                id: `urn:uuid:${crypto.randomUUID()}`,
                type: ['Achievement'],
                achievementType: 'Badge',
                name: 'Open Badges 3.0 Conformance',
                description:
                    'Demonstrates the ability to issue a valid Open Badges 3.0 AchievementCredential.',
                criteria: {
                    narrative:
                        'Awarded upon issuing an Open Badges 3.0 credential that passes JSON-LD validation in safe mode and satisfies the Open Badges 3.0 verification requirements.',
                },
            },
        },
    } as unknown as UnsignedVC;

    const signed = await learnCard.invoke.issueCredential(unsigned);

    const missingRoot = SPEC_REQUIRED_ROOT.filter(key => !(key in (signed as object)));
    const achievement = (signed as any).credentialSubject?.achievement ?? {};
    const missingAchievement = SPEC_REQUIRED_ACHIEVEMENT.filter(key => !(key in achievement));

    const strict = ConformantAchievementCredentialValidator.safeParse(signed);
    const verification = await learnCard.invoke.verifyCredential(signed, {}, true);

    console.log('=== CHECKS ===');
    console.log('issuer did          :', did);
    console.log('proof type          :', (signed as any).proof?.type);
    console.log('cryptosuite         :', (signed as any).proof?.cryptosuite);
    console.log('missing root fields :', missingRoot.length ? missingRoot : 'none');
    console.log('missing achievement :', missingAchievement.length ? missingAchievement : 'none');
    console.log('strict zod valid    :', strict.success);
    if (!strict.success) console.log(JSON.stringify(strict.error.issues, null, 2));
    console.log('verify errors       :', verification.errors);
    console.log('verify warnings     :', verification.warnings);
    console.log('\n=== CREDENTIAL ===');
    console.log(JSON.stringify(signed, null, 2));
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
