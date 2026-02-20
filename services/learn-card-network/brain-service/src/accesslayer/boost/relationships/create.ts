import { getAdminRole, getEmptyRole } from '@accesslayer/role/read';
import { CredentialInstance, BoostInstance } from '@models';
import { neogma } from '@instance';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from './update';

export const createBoostInstanceOfRelationship = async (
    credential: CredentialInstance,
    boost: BoostInstance
): Promise<void> => {
    await credential.relateTo({ alias: 'instanceOf', where: { id: boost.id } });
};

export const createReceivedCredentialRelationship = async (
    to: ProfileType,
    from: ProfileType,
    credential: CredentialInstance
): Promise<void> => {
    await credential.relateTo({
        alias: 'credentialReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};

export const setProfileAsBoostAdmin = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<void> => {
    const role = await getAdminRole(); // Ensure admin role exists
    await boost.relateTo({
        alias: 'hasRole',
        where: { profileId: profile.profileId },
        properties: { roleId: role.id },
    });

    await clearDidWebCacheForChildProfileManagers(boost.id);
};

export const giveProfileEmptyPermissions = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<void> => {
    const role = await getEmptyRole(); // Ensure empty role exists
    await boost.relateTo({
        alias: 'hasRole',
        where: { profileId: profile.profileId },
        properties: { roleId: role.id },
    });
};

export const setBoostAsParent = async (
    parentBoost: BoostInstance,
    childBoost: BoostInstance
): Promise<boolean> => {
    return Boolean(await parentBoost.relateTo({ alias: 'parentOf', where: { id: childBoost.id } }));
};

// Attach a SkillFramework to a Boost via USES_FRAMEWORK
export const setBoostUsesFramework = async (
    boost: BoostInstance,
    frameworkId: string
): Promise<void> => {
    await boost.relateTo({
        alias: 'usesFramework',
        where: { id: frameworkId },
        properties: { createdAt: new Date().toISOString() },
    });
};

// Align one or more Skills to a Boost via ALIGNED_TO (framework-scoped)
export const addAlignedSkillsToBoost = async (
    boost: BoostInstance,
    skillRefs: { frameworkId: string; id: string; proficiencyLevel?: number }[]
): Promise<void> => {
    if (skillRefs.length === 0) return;

    await neogma.queryRunner.run(
        `UNWIND $skillRefs AS sr
         MATCH (b:Boost { id: $boostId })
         MATCH (f:SkillFramework { id: sr.frameworkId })-[:CONTAINS]->(s:Skill { id: sr.id })
         MERGE (b)-[r:ALIGNED_TO]->(s)
         SET r.proficiencyLevel = sr.proficiencyLevel`,
        { boostId: boost.id, skillRefs }
    );
};

// Replace aligned skills for a Boost: remove any existing ALIGNED_TO relationships
// not present in the provided list, and upsert the provided relationships with
// per-relationship proficiencyLevel.
export const replaceAlignedSkillsForBoost = async (
    boost: BoostInstance,
    skillRefs: { frameworkId: string; id: string; proficiencyLevel?: number }[]
): Promise<void> => {
    const allowedKeys = skillRefs.map(sr => `${sr.frameworkId}:${sr.id}`);

    // Delete relationships not in the provided list
    await neogma.queryRunner.run(
        `WITH $allowedKeys AS allowed
         MATCH (b:Boost { id: $boostId })-[r:ALIGNED_TO]->(s:Skill)<-[:CONTAINS]-(f:SkillFramework)
         WITH r, f, s, allowed, (f.id + ':' + s.id) AS pairKey
         WHERE NOT pairKey IN allowed
         DELETE r`,
        { boostId: boost.id, allowedKeys }
    );

    // Upsert the provided relationships with relationship-level proficiency
    if (skillRefs.length > 0) {
        await neogma.queryRunner.run(
            `UNWIND $skillRefs AS sr
             MATCH (b:Boost { id: $boostId })
             MATCH (f:SkillFramework { id: sr.frameworkId })-[:CONTAINS]->(s:Skill { id: sr.id })
             MERGE (b)-[r:ALIGNED_TO]->(s)
             SET r.proficiencyLevel = sr.proficiencyLevel`,
            { boostId: boost.id, skillRefs }
        );
    }
};

export const createAutoConnectRecipientRelationship = async (
    boost: BoostInstance,
    recipient: ProfileType
): Promise<void> => {
    await boost.relateTo({
        alias: 'autoConnectRecipient',
        where: { profileId: recipient.profileId },
    });
};
