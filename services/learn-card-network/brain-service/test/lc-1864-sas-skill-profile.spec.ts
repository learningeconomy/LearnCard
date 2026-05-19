/**
 * LC-1864 reproducer: "Credential does not match boost template" when finishing
 * the AI Pathways "My Skill Profile" Step 5.
 *
 * Flow under test (mirrors useManageSelfAssignedSkillsBoost on the client):
 *   1. user constructs an unsigned SAS boost credential via newCredential({type: 'boost'})
 *   2. createBoost(credential) with status PROVISIONAL
 *   3. attachFrameworkToBoost + alignBoostSkills (multiple skills)
 *   4. getBoost.query → server injects OBv3 alignments into the returned template
 *   5. issueCredential locally (mimics learn-card-network plugin's sendBoost)
 *   6. boost.sendBoost(profileId, uri, credential) → server runs
 *      issueCertifiedBoost → verifyCredentialIsDerivedFromBoost.
 *
 * Expected: sendBoost succeeds and returns a credential URI.
 * Bug:      sendBoost throws "Credential does not match boost template."
 *           because verifyCredentialIsDerivedFromBoost returns false.
 */
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

    const buildSasUnsignedCredential = () => {
        // Mirrors the credentialPayload constructed in
        // packages/learn-card-base/src/react-query/mutations/boosts.ts:597-629
        return userA.learnCard.invoke.newCredential({
            type: 'boost',
            subject: userA.learnCard.id.did(),
            issuanceDate: new Date().toISOString(),
            boostName: SAS_BOOST_NAME,
            achievementType: SAS_ACHIEVEMENT_TYPE,
            achievementDescription:
                'A self-attested credential that lists the skills you have.',
            achievementNarrative: '',
            achievementName: SAS_BOOST_NAME,
            display: {
                displayType: 'badge',
                previewType: 'default',
            },
        } as any);
    };

    const issueLocallyAsClient = async (
        templateFromGetBoost: any,
        boostUri: string
    ): Promise<any> => {
        // Mirrors packages/plugins/learn-card-network/src/plugin.ts:1346-1414:
        // after getBoost returns the template (with alignments injected) the
        // client rewrites issuer, credentialSubject.id, validFrom and embeds
        // the boostId, then signs.
        const boost = { ...templateFromGetBoost };
        const me = userA.learnCard.id.did();

        if (Array.isArray(boost['@context'])) {
            // leave context as-is
        }

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
        // 1. Create a SAS-style boost template (VC 2.0, OBv3 BoostCredential, no alignments).
        const unsignedCredential = buildSasUnsignedCredential();

        // 2. Create the boost in PROVISIONAL state — same as the SAS flow.
        const boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: unsignedCredential,
            name: SAS_BOOST_NAME,
            type: SAS_ACHIEVEMENT_TYPE,
            category: 'Skill',
            status: 'PROVISIONAL',
        });

        // 3. Create a framework with multiple skills and align them to the boost.
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

        // 4. Fetch the boost — server injects OBv3 alignments into the template.
        const fetched = await userA.clients.fullAuth.boost.getBoost({ uri: boostUri });
        expect(fetched.boost).toBeDefined();

        // The injected template should now carry alignments derived from the
        // aligned skills. If this is empty, alignment injection silently failed
        // and the bug below would not match the production failure mode.
        const fetchedAchievement = (fetched.boost as any).credentialSubject?.achievement;
        expect(fetchedAchievement?.alignment?.length ?? 0).toBeGreaterThan(0);

        // 5. Sign the credential locally — same as the network plugin's sendBoost.
        const signed = await issueLocallyAsClient(fetched.boost, boostUri);

        // 6. Call boost.sendBoost — server runs verifyCredentialIsDerivedFromBoost.
        //    Bug: throws "Credential does not match boost template."
        await expect(
            userA.clients.fullAuth.boost.sendBoost({
                profileId: 'usera',
                uri: boostUri,
                credential: signed,
            })
        ).resolves.toBeDefined();
    });
});
