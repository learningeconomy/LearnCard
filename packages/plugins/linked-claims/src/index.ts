import { LearnCard } from '@learncard/core';
import { VC, UnsignedVC } from '@learncard/types';
import { VCPluginMethods } from '@learncard/vc-plugin';
import { LinkedClaimsPlugin, EndorsementDetails, LinkedClaimsPluginMethods } from './types';

export * from './types';

const ENDORSEMENT_CONTEXT = 'https://ctx.learncard.com/linked-claims/endorsement/1.0.0.json';

const getSubjectIds = (credential: VC): string[] => {
    const subject = credential.credentialSubject as any;
    if (Array.isArray(subject)) return subject.map(s => s?.id).filter(Boolean);
    return subject?.id ? [subject.id] : [];
};

const pickIndexProvider = (learnCard: any, preferred?: string): string | undefined => {
    const providers = Object.keys(learnCard.index || {}).filter(
        k => !['providers', 'all'].includes(k)
    );
    if (!providers.length) return undefined;
    if (preferred && providers.includes(preferred)) return preferred;
    if (providers.includes('LearnCloud')) return 'LearnCloud';
    return providers[0];
};

const pickStoreProvider = (learnCard: any, preferred?: string): string | undefined => {
    const providers = Object.keys(learnCard.store || {}).filter(k => k !== 'providers');
    if (!providers.length) return undefined;
    if (preferred && providers.includes(preferred)) return preferred;
    return providers[0];
};

const ensureArray = <T>(arr: T | T[] | undefined): T[] =>
    Array.isArray(arr) ? arr : arr ? [arr] : [];

export const getLinkedClaimsPlugin = (
    learnCard: LearnCard<any, 'id' | 'store' | 'index' | 'read', VCPluginMethods>
): LinkedClaimsPlugin => ({
    name: 'LinkedClaims',
    displayName: 'LinkedClaims',
    description: 'Create, verify, store, and retrieve endorsement credentials linked to originals.',
    methods: {
        endorseCredential: async (_learnCard, original, details, opts) => {
            const issuer = learnCard.id.did();

            const subjectIds = getSubjectIds(original);
            if (!subjectIds.length) throw new Error('Original credential has no credentialSubject.id');
            const endorsedId = subjectIds[0];

            const baseContext: (string | Record<string, any>)[] = [
                'https://www.w3.org/ns/credentials/v2',
            ];
            const originalCtx = ensureArray<string | Record<string, any>>(
                ((original as any)['@context'] as (string | Record<string, any>)[]) || []
            );
            const ctxItems: (string | Record<string, any>)[] = [
                ...baseContext,
                ENDORSEMENT_CONTEXT,
                ...originalCtx,
            ];
            const context = Array.from(new Set<string | Record<string, any>>(ctxItems));

            const types: [string, ...string[]] = ['VerifiableCredential', 'EndorsementClaim'];

            const unsigned: UnsignedVC = {
                '@context': context as any,
                type: types,
                issuer,
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    '@type': 'EndorsementClaim',
                    id: endorsedId,
                    endorsedId,
                    ...(details.recommendationText
                        ? { recommendationText: details.recommendationText }
                        : {}),
                    ...(typeof details.rating === 'number' ? { rating: details.rating } : {}),
                    ...(details.tags ? { tags: details.tags } : {}),
                    ...(details.portfolio ? { portfolio: details.portfolio } : {}),
                    ...(details.howKnow ? { howKnow: details.howKnow } : {}),
                    ...(details.qualifications ? { qualifications: details.qualifications } : {}),
                    ...(details.reference ? { reference: details.reference } : {}),
                    ...(details.metadata ? { metadata: details.metadata } : {}),
                },
                ...(details.reference ? { name: `Endorsement of ${details.reference}` } : {}),
            };

            return learnCard.invoke.issueCredential(unsigned);
        },

        verifyEndorsement: async (_learnCard, endorsement, options) => {
            const check = await learnCard.invoke.verifyCredential(endorsement, options);

            const ctx = ensureArray((endorsement as any)['@context']);
            const types = ensureArray((endorsement as any)['type']);

            if (!ctx.includes(ENDORSEMENT_CONTEXT)) {
                check.errors.push('linked-claims error: missing endorsement context');
            }
            if (!types.includes('EndorsementClaim')) {
                check.errors.push('linked-claims error: missing EndorsementClaim type');
            }

            const cs: any = (endorsement as any).credentialSubject;
            const csObj = Array.isArray(cs) ? cs[0] : cs;
            if (!csObj?.endorsedId || !csObj?.id || csObj.endorsedId !== csObj.id) {
                check.warnings.push('linked-claims warning: credentialSubject.id should equal endorsedId');
            }

            if (!check.errors.length) check.checks.push('linked-claims');
            return check;
        },

        storeEndorsement: async (_learnCard, endorsement, options) => {
            const storeName = pickStoreProvider(learnCard, options?.storeName);
            if (!storeName) throw new Error('No store plane provider available');

            const uri: string = await (learnCard.store as any)[storeName].upload(endorsement);

            const indexName = pickIndexProvider(learnCard, options?.indexName);
            let indexed = false;
            let id = (endorsement as any).id || `urn:uuid:${(globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;

            if (indexName) {
                const cs: any = (endorsement as any).credentialSubject;
                const csObj = Array.isArray(cs) ? cs[0] : cs;
                const record = {
                    id,
                    uri,
                    type: ensureArray((endorsement as any).type),
                    endorsedId: csObj?.endorsedId || csObj?.id,
                    subjectId: csObj?.id,
                    originalCredentialId: csObj?.reference,
                    issuedOn: (endorsement as any).validFrom || (endorsement as any).issuanceDate,
                    category: 'Endorsement',
                };
                indexed = await (learnCard.index as any)[indexName].add(record);
            }

            return { uri, indexed, id, indexName, storeName };
        },

        getEndorsements: async (_learnCard, original, options) => {
            const indexName = pickIndexProvider(learnCard, options?.indexName);
            if (!indexName) return [];

            const subjectIds = getSubjectIds(original);
            const originalId = (original as any).id;

            const query = originalId ? { originalCredentialId: originalId } : { endorsedId: subjectIds[0] };
            const records = await (learnCard.index as any)[indexName].get(query);

            const results: VC[] = [];
            for (const rec of records) {
                const vc = await learnCard.read.get(rec.uri);
                if (vc) results.push(vc as VC);
            }
            return results;
        },
    },
});
