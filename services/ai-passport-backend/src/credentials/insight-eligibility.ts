import type { InsightPromptCoverage, InsightCompactionStats } from '../services/insightCompaction';
export type InsightInputExclusionReason =
    | 'unsupported_cryptosuite'
    | 'unreadable_input'
    | 'verification_unavailable'
    | 'verification_failed'
    | 'subject_mismatch'
    | 'malformed_input';

export type InsightInputCoverage = {
    promptCoverage?: InsightPromptCoverage;
    compactionCoverage?: InsightCompactionStats;
    verifiedCount: number;
    excludedCount: number;
    exclusions: { reason: InsightInputExclusionReason; count: number }[];
};

export class NoEligibleInsightInputsError extends Error {
    readonly coverage: InsightInputCoverage;

    constructor(coverage: InsightInputCoverage) {
        super(
            coverage.promptCoverage?.includedCount === 0
                ? 'No whole verified credential projection fits the privacy input budget'
                : 'No supported, verified credentials are available for AI insights'
        );
        this.name = 'NoEligibleInsightInputsError';
        this.coverage = coverage;
    }
}

// Capability of the pinned DIDKit WASM, not a verdict on signature validity.
// Detect before full VC validation: valid Data Integrity proofs may omit created.
// Exclude the entire input, including every proof in its chain. Never rewrite it.
export const hasKnownUnsupportedInsightSuite = (credential: unknown): boolean => {
    if (!credential || typeof credential !== 'object') return false;
    const inspect = (value: unknown): boolean => {
        if (!value || typeof value !== 'object') return false;
        const rawProof = (value as Record<string, unknown>).proof;
        const proofs: unknown[] = Array.isArray(rawProof) ? rawProof : [rawProof];
        return proofs.some(proof => {
            if (!proof || typeof proof !== 'object') return false;
            const entry = proof as Record<string, unknown>;
            return entry.type === 'DataIntegrityProof' && entry.cryptosuite === 'ecdsa-sd-2023';
        });
    };
    const value = credential as Record<string, unknown>;
    return inspect(value) || inspect(value.boostCredential);
};
