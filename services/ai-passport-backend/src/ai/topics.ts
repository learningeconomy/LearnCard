import { createHmac } from 'node:crypto';
import { withDistributedSingleFlight } from '../utils/distributedSingleFlight';

import type { DBCredentialRecord } from '../db';
import {
    getCredentialProjection,
    serializeModelSafeCredentialRecords,
} from '../credentials/projection';
import { assertCurrentAiConsent, getCurrentAiSubject } from './privacy';
import { getPrivacyKeyMaterial, getPrivacySubjectRef } from './privacy-keys';
import { AiConsentError } from '../learncard/consent';

export type TopicCredential = DBCredentialRecord;
import cache from '../utils/cache';
import { aiCall } from '../ai/client';
import { TopicsSchema } from './generation-schemas';
import { FORMATTING_MODEL } from '../constants/env';
import { getCurrentLocale, normalizeAiLocale } from './locale';

// Non-personal suggestions for a live grant with no shared learning facts.
export const DEFAULT_TOPICS = [
    'Machine Learning',
    'Web Development',
    'Data Science',
    'Climate Change',
    'Quantum Computing',
];

// Maximum number of quick topics to generate
const MAX_QUICK_TOPICS = 5;

// TTL for topics cache in seconds (15 minutes)
export const TOPICS_CACHE_TTL = 15 * 60;

type TopicsCacheEntry = {
    fingerprint: string;
    topics: string[];
};

const TOPICS_GENERATION_VERSION = '1';

export function getTopicsFingerprint(credentials: TopicCredential[]): string {
    return createHmac('sha256', getPrivacyKeyMaterial().reference)
        .update(
            JSON.stringify({
                generationVersion: TOPICS_GENERATION_VERSION,
                model: FORMATTING_MODEL,
            })
        )
        .update('\n')
        .update(
            credentials
                .map(credential => JSON.stringify(getCredentialProjection(credential)))
                .sort()
                .join('\n')
        )
        .digest('hex');
}

export function getTopicsCacheKey(
    did: string,
    revision: string,
    fingerprint: string,
    locale: string = normalizeAiLocale(getCurrentLocale())
): string {
    return `topics:${getPrivacySubjectRef(did)}:${locale}:${revision}:${fingerprint}`;
}

export function parseTopicsCacheValue(value: string): TopicsCacheEntry | null {
    try {
        const parsed = JSON.parse(value) as Partial<TopicsCacheEntry>;

        if (
            typeof parsed.fingerprint !== 'string' ||
            !Array.isArray(parsed.topics) ||
            !parsed.topics.every(topic => typeof topic === 'string')
        ) {
            return null;
        }

        return { fingerprint: parsed.fingerprint, topics: parsed.topics };
    } catch {
        return null;
    }
}

/**
 * Generate quick suggested topics based ONLY on raw credential types and basic info.
 * This function is designed to be FAST and does NOT use AI or the cache.
 */
export function generateQuickTopics(credentials: TopicCredential[]): string[] {
    if (!credentials || credentials.length === 0) {
        return DEFAULT_TOPICS;
    }

    const topicsSet = new Set<string>();

    for (const vc of credentials) {
        const potentialTopic = vc.category
            .replace(/([A-Z])/g, ' $1')
            .replace(/Credential|Certified|Boost|Attestation/gi, '')
            .trim();

        if (potentialTopic.length > 3) topicsSet.add(potentialTopic);
    }

    for (const topic of DEFAULT_TOPICS) topicsSet.add(topic);

    return [...topicsSet].slice(0, MAX_QUICK_TOPICS);
}

/**
 * Generate suggested topics based on the user's credentials using AI
 * This function does NOT use the cache
 */
export async function generateTopics(
    did: string,
    credentials: TopicCredential[]
): Promise<string[]> {
    await assertTopicConsent(did, credentials);
    if (!credentials.length) return DEFAULT_TOPICS;
    const result = await aiCall({
        model: FORMATTING_MODEL,
        systemPrompt:
            'Suggest five useful learning topics based only on the supplied verified learning facts.',
        message: serializeModelSafeCredentialRecords(credentials),
        output: TopicsSchema,
    });
    await assertTopicConsent(did, credentials);
    return result.topics.slice(0, MAX_QUICK_TOPICS);
}

async function assertTopicConsent(did: string, credentials: TopicCredential[]) {
    if (getCurrentAiSubject() !== did) throw new AiConsentError();
    const receipt = await assertCurrentAiConsent('model-inference');
    const shared = new Set(receipt.credentialUris);
    for (const credential of credentials) {
        if (
            !shared.has(credential.uri) ||
            credential.verification?.consent.revision !== receipt.revision
        ) {
            throw new AiConsentError('Topic context is no longer authorized');
        }
        getCredentialProjection(credential);
    }
    return receipt;
}

/**
 * Get suggested topics based on DID - will use Redis cache if available
 */
export async function getSuggestedTopics(
    did: string,
    credentials: TopicCredential[]
): Promise<string[]> {
    const receipt = await assertTopicConsent(did, credentials);
    const fingerprint = getTopicsFingerprint(credentials);
    const key = getTopicsCacheKey(did, receipt.revision, fingerprint);
    const topics = await withDistributedSingleFlight(`topic-generation:${key}`, async () => {
        const cachedJson = await cache.get(key);
        const cached = cachedJson ? parseTopicsCacheValue(cachedJson) : null;
        if (cached?.fingerprint === fingerprint) {
            await assertTopicConsent(did, credentials);
            return cached.topics;
        }
        const topics = await generateTopics(did, credentials);
        await assertTopicConsent(did, credentials);
        await cache.set(
            key,
            JSON.stringify({ fingerprint, topics } satisfies TopicsCacheEntry),
            TOPICS_CACHE_TTL
        );
        await assertTopicConsent(did, credentials);
        return topics;
    });
    await assertTopicConsent(did, credentials);
    return topics;
}

/**
 * Warm up the topics cache in the background (non-blocking)
 * This calls the AI-powered generation and caches the result.
 */
export async function warmUpTopicsCache(
    did: string,
    credentials: TopicCredential[]
): Promise<string[]> {
    return getSuggestedTopics(did, credentials);
}
