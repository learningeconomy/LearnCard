import { CATEGORY_MAP } from '../../../packages/learn-card-base/src/helpers/credentialCategoryMap';
import { z } from 'zod';
import type { ConsumerWallet } from './consumer-apps';
import { credentialCategoryForDisplay } from './credential-category';

export class ClaimFailure extends Error {
    constructor(
        readonly kind:
            'unavailable' | 'changed' | 'signature' | 'family' | 'connection' | 'signIn' | 'pending'
    ) {
        super(`claims:${kind}`);
    }
}
export const claimErrorCode = (error: unknown) =>
    error instanceof ClaimFailure ? error.message : 'claims:connection';
const uri = (kind: string) =>
    z
        .string()
        .regex(
            new RegExp(
                `^lc:network:staging\\.network\\.learncard\\.com/trpc:${kind}:[A-Za-z0-9_-]{1,200}$`
            )
        );
const link = z
    .object({
        boostURI: uri('boost'),
        challenge: z
            .string()
            .min(1)
            .max(2048)
            .refine(
                value =>
                    !/\s/u.test(value) &&
                    [...value].every(character => character.codePointAt(0)! >= 32)
            ),
    })
    .strict();
const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const first = (value: unknown) => object(Array.isArray(value) ? value[0] : value);
export const claimPreviewURL = (boostURI: string, challenge: string): URL => {
    link.parse({ boostURI, challenge });
    const url = new URL('https://staging.network.learncard.com/api/storage/resolve');
    url.searchParams.set('uri', boostURI);
    url.searchParams.set('challenge', challenge);
    return url;
};
const mappedCategory = (value: unknown) =>
    typeof value === 'string' && Object.hasOwn(CATEGORY_MAP, value)
        ? CATEGORY_MAP[value as keyof typeof CATEGORY_MAP]
        : undefined;
export const categoryForClaim = (raw: unknown): string => {
    const value = object(raw),
        achievement = first(first(value.credentialSubject).achievement);
    const inferred =
        mappedCategory(achievement.achievementType) ??
        (Array.isArray(value.type)
            ? [...value.type].reverse().map(mappedCategory).find(Boolean)
            : mappedCategory(value.type));
    return credentialCategoryForDisplay(inferred, value) ?? inferred ?? 'Achievement';
};

/** Capability reads and issuance are separate. The native durable journal owns retries. */
export const createClaimCommands = (
    currentWallet: () => ConsumerWallet | undefined,
    display: (
        record: Record<string, unknown>,
        verify?: boolean,
        raw?: Record<string, unknown>
    ) => Promise<unknown>,
    resolve: (boostURI: string, challenge: string) => Promise<unknown>
) => {
    const previews = new Map<string, string>();
    const wallet = () => {
        const lc = currentWallet();
        if (!lc) throw new ClaimFailure('signIn');
        return lc;
    };
    const current = (lc: ConsumerWallet) => {
        if (currentWallet() !== lc) throw new ClaimFailure('signIn');
    };
    const template = async (input: unknown) => {
        const value = link.parse(input),
            lc = wallet();
        const raw = object(await resolve(value.boostURI, value.challenge));
        current(lc);
        if (!raw['@context'] || !raw.credentialSubject || !raw.type)
            throw new ClaimFailure('unavailable');
        if (
            object(raw.display).displayType === 'family' ||
            categoryForClaim(raw) === 'Family' ||
            JSON.stringify(raw.type).toLowerCase().includes('family')
        )
            throw new ClaimFailure('family');
        return { value, lc, raw };
    };
    return {
        claimsPreview: async (input: unknown) => {
            const { value, lc, raw } = await template(input);
            const credential = await display(
                { uri: value.boostURI, category: categoryForClaim(raw) },
                false,
                raw
            );
            current(lc);
            if (previews.size >= 16) previews.clear();
            previews.set(JSON.stringify(value), JSON.stringify(raw));
            return credential;
        },
        claimsIssue: async (input: unknown) => {
            const { value, lc, raw } = await template(input);
            if (previews.get(JSON.stringify(value)) !== JSON.stringify(raw))
                throw new ClaimFailure('changed');
            // Remove before the write: repeated commands cannot issue again in this host.
            previews.delete(JSON.stringify(value));
            const result = await lc.invoke.claimBoostWithLink(value.boostURI, value.challenge);
            current(lc);
            return { uri: uri('credential').parse(result) };
        },
        claimsFinish: async (input: unknown) => {
            const value = z
                    .object({ uri: uri('credential') })
                    .strict()
                    .parse(input),
                lc = wallet();
            const received = await lc.invoke.getReceivedCredentials();
            current(lc);
            if (!received.some(item => item.uri === value.uri && item.received))
                throw new ClaimFailure('pending');
            const raw = object(await lc.read.get(value.uri));
            current(lc);
            const proof = await lc.invoke.verifyCredential(raw as never, { checks: ['proof'] });
            current(lc);
            if (proof.errors.length) throw new ClaimFailure('signature');
            const category = categoryForClaim(raw);
            if (category === 'Family') throw new ClaimFailure('family');
            const achievement = first(first(raw.credentialSubject).achievement);
            const title =
                typeof raw.name === 'string'
                    ? raw.name
                    : typeof achievement.name === 'string'
                      ? achievement.name
                      : 'Credential';
            const indexed = await lc.index.LearnCloud.get({ uri: value.uri });
            current(lc);
            if (!indexed.length)
                await lc.index.LearnCloud.add({
                    id: value.uri,
                    uri: value.uri,
                    title,
                    category: category as never,
                });
            current(lc);
            return display({ uri: value.uri, title, category }, true, raw);
        },
        claimsReconcile: async (input: unknown) => {
            const value = z
                    .object({ boostURI: uri('boost'), since: z.string().datetime() })
                    .strict()
                    .parse(input),
                lc = wallet();
            const records = (await lc.invoke.getReceivedCredentials())
                .filter(
                    item =>
                        item.received && Date.parse(item.sent) >= Date.parse(value.since) - 120_000
                )
                .sort((a, b) => Date.parse(b.sent) - Date.parse(a.sent))
                .slice(0, 50);
            current(lc);
            const matches: string[] = [];
            for (const record of records) {
                const raw = object(await lc.read.get(record.uri));
                current(lc);
                if (raw.boostId === value.boostURI) matches.push(record.uri);
            }
            // Never choose by title/issuer or pick arbitrarily between multiple issuances.
            return matches.length === 1 ? { uri: uri('credential').parse(matches[0]) } : null;
        },
    };
};
