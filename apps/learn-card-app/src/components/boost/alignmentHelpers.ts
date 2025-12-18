import { BoostCMSAlignment, BoostCMSSkill } from './boost';

// Convert a BoostCMSSkill to a top-level alignment
export const toSkillAlignment = (skill: BoostCMSSkill): BoostCMSAlignment => ({
    type: 'Alignment',
    targetName: skill.skill,
    targetFramework: String(skill.category),
});

// Convert a subskill to an alignment, using the parent skill as framework
export const toSubskillAlignment = (skillName: string, subskill: string): BoostCMSAlignment => ({
    type: 'Alignment',
    targetName: String(subskill),
    targetFramework: String(skillName),
});

// Build alignments from an array of BoostCMSSkill entries
export const alignmentsFromSkills = (skills: BoostCMSSkill[] = []): BoostCMSAlignment[] =>
    skills.flatMap(s => [
        toSkillAlignment(s),
        ...(s?.subskills ?? []).map(ss => toSubskillAlignment(s.skill, ss)),
    ]);

export const getFrameworkIdAndSkillIdFromUrl = (url: string) => {
    const frameworkIdMatch = url.match(/frameworks\/([^/]+)/);
    const skillIdMatch = url.match(/skills\/([^/]+)/);

    return {
        frameworkId: frameworkIdMatch ? frameworkIdMatch[1] : undefined,
        skillId: skillIdMatch ? skillIdMatch[1] : undefined,
    };
};

// Derive alignments from a VC: prefer OBv3 alignment if present; fallback to legacy skills
export const deriveAlignmentsFromVC = (vc: any): (BoostCMSAlignment & { id: string })[] => {
    // OBv3 uses 'alignment' (singular), not 'alignments' (plural)
    const vcAlignments: (BoostCMSAlignment & { id: string })[] =
        vc?.credentialSubject?.achievement?.alignment?.map((a: any) => {
            const { frameworkId: frameworkIdFromUrl, skillId: skillIdFromUrl } =
                getFrameworkIdAndSkillIdFromUrl(a.targetUrl ?? '');

            const frameworkId = a.frameworkId || frameworkIdFromUrl;
            const skillId = a.id || skillIdFromUrl;

            return {
                ...a,
                targetFramework: frameworkId,
                id: skillId,
            };
        }) ?? [];

    return vcAlignments;

    // if (vcAlignments && vcAlignments.length > 0) return vcAlignments;

    // const vcSkills: BoostCMSSkill[] = vc?.skills ?? [];
    // return alignmentsFromSkills(vcSkills);
};

/**
 * Extract skill IDs from alignments for Neo4j-based skill management
 * When creating boosts with framework-based skills, alignments will have targetCode
 * which contains the actual Neo4j skill node ID and targetUrl contains both framework and skill IDs
 */
export const extractSkillIdsFromAlignments = (
    alignments: (BoostCMSAlignment & { id?: string })[]
): { frameworkId: string; id: string }[] | undefined => {
    if (!alignments || alignments.length === 0) return undefined;

    // Extract both frameworkId and skill id from alignments
    const skills = alignments
        .map(a => {
            let skillId: string | null = null;
            let frameworkId: string | null = null;

            // First, check if alignment has frameworkId directly (from skill selection UI)
            if (a.frameworkId) {
                frameworkId = a.frameworkId;
            }

            // Check if alignment has id directly (from SkillFrameworkNode)
            const alignment = a as any;
            if (alignment.id) {
                skillId = alignment.id;
            }

            // Fallback: Parse targetUrl to extract both framework and skill IDs
            // Format: https://domain/frameworks/{frameworkId}/skills/{skillId}
            if (!frameworkId || !skillId) {
                if (a.targetUrl) {
                    const urlMatch = a.targetUrl.match(/frameworks\/([^/]+)\/skills\/([^/?]+)/);
                    if (urlMatch) {
                        if (!frameworkId) frameworkId = decodeURIComponent(urlMatch[1]);
                        if (!skillId) skillId = decodeURIComponent(urlMatch[2]);
                    }
                }
            }

            // Fallback: try targetCode for skill ID
            if (!skillId && a.targetCode) {
                skillId = a.targetCode;
            }

            // If we have both IDs, return the skill reference
            if (frameworkId && skillId) {
                return { frameworkId, id: skillId };
            }

            return null;
        })
        .filter((skill): skill is { frameworkId: string; id: string } => skill !== null);

    return skills.length > 0 ? skills : undefined;
};
