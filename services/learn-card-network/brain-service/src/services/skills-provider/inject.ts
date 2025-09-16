import type { UnsignedVC, VC } from '@learncard/types';
import type { BoostInstance } from '@models';
import { getSkillsProvider } from './index';
import {
    getAlignedSkillsForBoost,
    getFrameworkUsedByBoost,
} from '@accesslayer/boost/relationships/read';
import type { Obv3Alignment } from './types';

// Mutates the given credential in-place to add OBv3 alignments, if any exist on the boost.
export async function injectObv3AlignmentsIntoCredentialForBoost(
    credential: UnsignedVC | VC,
    boost: BoostInstance
): Promise<void> {
    try {
        const [framework, skills] = await Promise.all([
            getFrameworkUsedByBoost(boost),
            getAlignedSkillsForBoost(boost),
        ]);

        if (!framework || skills.length === 0) return;

        const frameworkId: string | undefined = (framework as any)?.dataValues?.id ?? framework?.id;
        const skillIds: string[] = skills
            .map(s => (s as any)?.dataValues?.id ?? (s as any)?.id)
            .filter(Boolean);

        if (!frameworkId || skillIds.length === 0) return;

        const provider = getSkillsProvider();
        const alignments = await provider.buildObv3Alignments(frameworkId, skillIds);

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
export async function buildObv3AlignmentsForBoost(boost: BoostInstance): Promise<Obv3Alignment[]> {
    try {
        const [framework, skills] = await Promise.all([
            getFrameworkUsedByBoost(boost),
            getAlignedSkillsForBoost(boost),
        ]);

        if (!framework || skills.length === 0) return [];

        const frameworkId: string | undefined = (framework as any)?.dataValues?.id ?? framework?.id;
        const skillIds: string[] = skills
            .map(s => (s as any)?.dataValues?.id ?? (s as any)?.id)
            .filter(Boolean);

        if (!frameworkId || skillIds.length === 0) return [];

        const provider = getSkillsProvider();
        const alignments = await provider.buildObv3Alignments(frameworkId, skillIds);
        const cleaned = (alignments || []).map(a =>
            Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined))
        ) as Obv3Alignment[];
        return cleaned;
    } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[skills-provider] Failed to build OBv3 alignments:', e);
        }
        return [];
    }
}
