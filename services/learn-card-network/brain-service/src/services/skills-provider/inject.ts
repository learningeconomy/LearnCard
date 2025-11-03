import type { UnsignedVC, VC } from '@learncard/types';
import type { BoostInstance } from '@models';
import { getSkillsProvider } from './index';
import { getAlignedSkillsForBoost } from '@accesslayer/boost/relationships/read';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import type { Obv3Alignment } from './types';

// Mutates the given credential in-place to add OBv3 alignments, if any exist on the boost.
export async function injectObv3AlignmentsIntoCredentialForBoost(
    credential: UnsignedVC | VC,
    boost: BoostInstance,
    domain: string
): Promise<void> {
    try {
        const skills = await getAlignedSkillsForBoost(boost);
        if (!skills || skills.length === 0) return;

        // Group aligned skills by their frameworkId (excluding containers)
        const byFramework = new Map<string, string[]>();
        for (const skill of skills) {
            const props = ((skill as any)?.dataValues ?? (skill as any)) as
                | Record<string, any>
                | undefined;
            if (!props) continue;

            const type = typeof props.type === 'string' ? props.type.toLowerCase() : undefined;
            if (type === 'container') continue;

            const sid = props.id as string | undefined;
            const fid = props.frameworkId as string | undefined;
            if (!sid || !fid) continue;

            const arr = byFramework.get(fid) ?? [];
            if (!arr.includes(sid)) arr.push(sid);
            byFramework.set(fid, arr);
        }

        const provider = getSkillsProvider();
        let alignments: any[] = [];

        // Get unique framework IDs from the aligned skills
        const uniqueFrameworkIds = [...byFramework.keys()];

        // Look up each framework and build alignments
        for (const fwId of uniqueFrameworkIds) {
            const idsForFramework = byFramework.get(fwId) ?? [];
            if (idsForFramework.length === 0) continue;

            // Verify framework exists before building alignments
            const framework = await getSkillFrameworkById(fwId);
            if (!framework) continue;

            const res = await provider.buildObv3Alignments(fwId, idsForFramework, domain);
            if (Array.isArray(res) && res.length > 0) alignments = alignments.concat(res);
        }

        if (!alignments || alignments.length === 0) return;

        // Prune undefined values to match typical JSON serialization and client behavior
        const cleanedAlignments = alignments.map(a =>
            Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined))
        ) as any[];

        // Ensure JSON-LD alignment entries have a type, matching plugin behavior
        const jsonLdAlignments = cleanedAlignments.map(a => ({ ...a, type: ['Alignment'] }));

        const addAlignments = (subject: any) => {
            if (!subject) return;
            // OBv3-style: achievement.alignment[] preferred if present
            if (subject.achievement) {
                const ach = subject.achievement;
                if (!Array.isArray(ach.alignment))
                    ach.alignment = Array.isArray(ach.alignment) ? ach.alignment : [];
                ach.alignment = [...ach.alignment, ...jsonLdAlignments];
                return;
            }
            // Fallback: subject.alignment[]
            if (!Array.isArray(subject.alignment))
                subject.alignment = Array.isArray(subject.alignment) ? subject.alignment : [];
            subject.alignment = [...subject.alignment, ...jsonLdAlignments];
        };

        if (Array.isArray(credential.credentialSubject)) {
            credential.credentialSubject.forEach(addAlignments);
        } else {
            addAlignments(credential.credentialSubject as any);
        }
    } catch (e) {
        // Non-fatal: alignment injection should never break issuance
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[skills-provider] Failed to inject OBv3 alignments:', e);
        }
    }
}

// Returns OBv3 alignments for a given boost without mutating any credential
export async function buildObv3AlignmentsForBoost(
    boost: BoostInstance,
    domain: string
): Promise<Obv3Alignment[]> {
    try {
        const skills = await getAlignedSkillsForBoost(boost);
        if (!skills || skills.length === 0) return [];

        // Group aligned skills by their frameworkId (excluding containers)
        const byFramework = new Map<string, string[]>();
        for (const skill of skills) {
            const props = ((skill as any)?.dataValues ?? (skill as any)) as
                | Record<string, any>
                | undefined;
            if (!props) continue;

            const type = typeof props.type === 'string' ? props.type.toLowerCase() : undefined;
            if (type === 'container') continue;

            const sid = props.id as string | undefined;
            const fid = props.frameworkId as string | undefined;
            if (!sid || !fid) continue;

            const arr = byFramework.get(fid) ?? [];
            if (!arr.includes(sid)) arr.push(sid);
            byFramework.set(fid, arr);
        }

        const provider = getSkillsProvider();
        let cleaned: Obv3Alignment[] = [];

        // Get unique framework IDs from the aligned skills
        const uniqueFrameworkIds = [...byFramework.keys()];

        // Look up each framework and build alignments
        for (const fwId of uniqueFrameworkIds) {
            const idsForFramework = byFramework.get(fwId) ?? [];
            if (idsForFramework.length === 0) continue;

            // Verify framework exists before building alignments
            const framework = await getSkillFrameworkById(fwId);
            if (!framework) continue;

            const alignments = await provider.buildObv3Alignments(fwId, idsForFramework, domain);
            const cleanedPart = (alignments || []).map(a =>
                Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined))
            ) as Obv3Alignment[];
            cleaned = cleaned.concat(cleanedPart);
        }

        return cleaned;
    } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[skills-provider] Failed to build OBv3 alignments:', e);
        }
        return [];
    }
}
