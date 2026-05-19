// LC-1864: sendBoost must not reject a boost that has aligned OBv3 skills.
import crypto from 'crypto';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';

import { getUser } from './helpers/getClient';
import { Profile, SkillFramework, Skill, Boost, Credential } from '@models';

const SAS_BOOST_NAME = 'Self-Assigned Skills';
const SAS_ACHIEVEMENT_TYPE = 'ext:SelfAssignedSkills';

describe('LC-1864 SAS skill profile finish step', () => {
    let userA: Awaited<ReturnType<typeof getUser>>;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    const cleanupGraph = async () => {
        await Skill.delete({ detach: true, where: {} });
        await SkillFramework.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    };

    beforeEach(async () => {
        await cleanupGraph();
        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
    });

    afterAll(async () => {
        await cleanupGraph();
    });

    const buildSasUnsignedCredential = () =>
        userA.learnCard.invoke.newCredential({
            type: 'boost',
            subject: userA.learnCard.id.did(),
            issuanceDate: new Date().toISOString(),
            boostName: SAS_BOOST_NAME,
            achievementType: SAS_ACHIEVEMENT_TYPE,
            achievementDescription:
                'A self-attested credential that lists the skills you have.',
            achievementNarrative: '',
            achievementName: SAS_BOOST_NAME,
            display: { displayType: 'badge', previewType: 'default' },
        } as any);

    // Mirrors the network plugin's sendBoost client-side prep before issuance.
    const issueLocallyAsClient = async (
        templateFromGetBoost: any,
        boostUri: string
    ): Promise<any> => {
        const boost = { ...templateFromGetBoost };
        const me = userA.learnCard.id.did();

        if ('validFrom' in boost) {
            boost.validFrom = new Date().toISOString();
        } else {
            boost.issuanceDate = new Date().toISOString();
        }
        boost.issuer = me;

        if (Array.isArray(boost.credentialSubject)) {
            boost.credentialSubject = boost.credentialSubject.map((s: any) => ({
                ...s,
                id: me,
            }));
        } else {
            boost.credentialSubject = { ...boost.credentialSubject, id: me };
        }

        if (Array.isArray(boost.type) && boost.type.includes('BoostCredential')) {
            boost.boostId = boostUri;
        }

        return userA.learnCard.invoke.issueCredential(boost);
    };

    it('sendBoost succeeds for an aligned-skills boost (regression guard)', async () => {
        const unsignedCredential = buildSasUnsignedCredential();

        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: unsignedCredential,
            name: SAS_BOOST_NAME,
            type: SAS_ACHIEVEMENT_TYPE,
            category: 'Skill',
            status: 'PROVISIONAL',
        });

        const frameworkId = `fw-sas-${crypto.randomUUID()}`;
        const skillIds = ['skill-alpha', 'skill-beta', 'skill-gamma'];
        await userA.clients.fullAuth.skillFrameworks.createManaged({
            id: frameworkId,
            name: 'SAS Test Framework',
            skills: skillIds.map(id => ({
                id: `${frameworkId}-${id}`,
                statement: `Statement for ${id}`,
            })),
        });

        await userA.clients.fullAuth.boost.attachFrameworkToBoost({
            boostUri,
            frameworkId,
        });

        const aligned = await userA.clients.fullAuth.boost.alignBoostSkills({
            boostUri,
            skills: skillIds.map(id => ({
                frameworkId,
                id: `${frameworkId}-${id}`,
                proficiencyLevel: 2,
            })),
        });
        expect(aligned).toBe(true);

        const fetched = await userA.clients.fullAuth.boost.getBoost({ uri: boostUri });
        expect(fetched.boost).toBeDefined();

        // Sanity-check that injection produced alignments — otherwise the
        // sendBoost assertion below wouldn't exercise the regressed path.
        const fetchedAchievement = (fetched.boost as any).credentialSubject?.achievement;
        expect(fetchedAchievement?.alignment?.length ?? 0).toBeGreaterThan(0);

        const signed = await issueLocallyAsClient(fetched.boost, boostUri);

        await expect(
            userA.clients.fullAuth.boost.sendBoost({
                profileId: 'usera',
                uri: boostUri,
                credential: signed,
            })
        ).resolves.toBeDefined();
    });
});
