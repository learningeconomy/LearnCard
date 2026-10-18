import { z } from 'zod';
import type { ConsumerWallet } from './consumer-apps';
import { validateCollectionCursor } from './collection-pagination';

type Row = Record<string, unknown>;
const object = (value: unknown): Row =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : value ? [value] : []);
const categories = new Set([
    'Social Badge',
    'Achievement',
    'Accomplishment',
    'Course',
    'Learning History',
    'Work History',
    'Experience',
    'Qualifications',
    'Accommodation',
    'ID',
    'Skill',
    'Self-Assigned Skills',
]);
const goalKey = 'skill-profile-goals';
export const goalsIndexID = `__verifiable_data_${goalKey}__`;
export class LearnerFailure extends Error {
    constructor(
        readonly kind:
            'signIn' | 'connection' | 'unavailable' | 'changed' | 'invalid' | 'busy' | 'uncertain'
    ) {
        super(`learner:${kind}`);
    }
}
export const learnerErrorCode = (error: unknown) =>
    error instanceof LearnerFailure ? error.message : 'learner:connection';
const canonical = (value: unknown): string =>
    JSON.stringify(
        value && typeof value === 'object'
            ? Array.isArray(value)
                ? value.map(item => JSON.parse(canonical(item)))
                : Object.fromEntries(
                      Object.keys(value)
                          .sort()
                          .map(key => [key, JSON.parse(canonical((value as Row)[key]))])
                  )
            : value
    );
const digest = async (value: unknown) =>
    [
        ...new Uint8Array(
            await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)))
        ),
    ]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

/** Pure projection: retain source identity; neither an alignment nor a self-rating proves mastery. */
export const skillsFromCredential = (record: Row, original: unknown, holderDid?: string) => {
    const outer = object(original);
    const vc = object(outer.boostCredential ?? outer);
    const issuer = object(vc.issuer);
    const sources = list(vc.credentialSubject).flatMap(subject =>
        list(object(subject).achievement)
    );
    const selfReported =
        record.category === 'Self-Assigned Skills' ||
        (!!holderDid &&
            (text(issuer.id) || text(vc.issuer)) === holderDid &&
            [
                text(record.title),
                text(vc.name),
                ...sources.map(item => text(object(item).name)),
            ].includes('Self-Assigned Skills'));
    const found = new Map<
        string,
        {
            id: string;
            name: string;
            description: string;
            framework: string;
            sources: { id: string; title: string; issuer: string; selfReported: boolean }[];
        }
    >();
    for (const achievement of sources)
        for (const raw of list(object(achievement).alignment)) {
            const alignment = object(raw),
                id = text(alignment.targetUrl);
            try {
                const url = new URL(id);
                if (
                    url.protocol !== 'https:' ||
                    url.username ||
                    url.password ||
                    !/\/frameworks\/[^/]+\/skills\/[^/]+\/?$/u.test(url.pathname)
                )
                    continue;
            } catch {
                continue;
            }
            if (!text(alignment.targetName).trim() || found.has(id)) continue;
            found.set(id, {
                id,
                name: text(alignment.targetName).slice(0, 300),
                description: text(alignment.targetDescription).slice(0, 4000),
                framework: text(alignment.targetFramework).slice(0, 300),
                sources: [
                    {
                        id: text(record.id),
                        title: (
                            text(record.title) ||
                            text(vc.name) ||
                            text(object(achievement).name)
                        ).slice(0, 300),
                        issuer: text(issuer.name).slice(0, 400),
                        selfReported,
                    },
                ],
            });
        }
    return [...found.values()];
};

/** Account-owned reads and explicit saves. Never starts AI or creates a sharing agreement. */
export const createLearnerCommands = (
    currentWallet: () => ConsumerWallet | undefined,
    display: (record: Row) => Promise<unknown>
) => {
    let busy = false;
    const wallet = () => {
        const lc = currentWallet();
        if (!lc) throw new LearnerFailure('signIn');
        return lc;
    };
    const check = (lc: ConsumerWallet) => {
        if (currentWallet() !== lc) throw new LearnerFailure('signIn');
    };
    const readGoals = async (lc: ConsumerWallet) => {
        const records = await lc.index.LearnCloud.get({ id: goalsIndexID });
        check(lc);
        if (records.length > 1) throw new LearnerFailure('unavailable');
        const record = records[0] as Row | undefined;
        let payload: Row = {};
        if (record) {
            if (record.id !== goalsIndexID || !text(record.uri))
                throw new LearnerFailure('unavailable');
            let value: unknown = record.verifiableData;
            if (value === undefined) {
                const raw = object(await lc.read.get(text(record.uri)));
                check(lc);
                const subject = object(list(raw.credentialSubject)[0]);
                if (subject.dataKey !== goalKey) throw new LearnerFailure('unavailable');
                value = subject.dataPayload;
            }
            payload = object(value);
            if (
                !Array.isArray(payload.goals) ||
                payload.goals.length > 200 ||
                payload.goals.some(goal => typeof goal !== 'string' || goal.length > 4000)
            )
                throw new LearnerFailure('unavailable');
        }
        const revision = await digest({ uri: record?.uri ?? '', payload });
        check(lc);
        return { record, payload, value: { goals: (payload.goals ?? []) as string[], revision } };
    };
    return {
        skillsPage: async (input: unknown) => {
            const lc = wallet();
            const parsed = z
                .object({ cursor: z.string().max(4096).optional() })
                .strict()
                .safeParse(input);
            if (!parsed.success || !lc.index.LearnCloud.getPage)
                throw new LearnerFailure('unavailable');
            const page = await lc.index.LearnCloud.getPage(
                {},
                { limit: 20, cursor: parsed.data.cursor, sort: 'newestFirst' }
            );
            check(lc);
            validateCollectionCursor(
                page.hasMore,
                page.cursor,
                new Set(parsed.data.cursor ? [parsed.data.cursor] : [])
            );
            const skills: ReturnType<typeof skillsFromCredential> = [];
            let unavailable = 0;
            const records = page.records.filter(
                record =>
                    categories.has(text(record.category)) &&
                    !record.id.startsWith('__verifiable_data_')
            );
            // Bound each command and yield between pages so Passport/Inbox reads remain responsive.
            for (let index = 0; index < records.length; index += 4) {
                const batch = await Promise.all(
                    records.slice(index, index + 4).map(async record => {
                        try {
                            const raw = await lc.read.get(record.uri);
                            check(lc);
                            if (
                                !raw ||
                                typeof raw !== 'object' ||
                                (!list(object(raw).type).includes('VerifiableCredential') &&
                                    !object(raw).boostCredential)
                            )
                                throw new LearnerFailure('unavailable');
                            return skillsFromCredential(record as Row, raw, lc.id.did());
                        } catch {
                            check(lc);
                            unavailable++;
                            return [];
                        }
                    })
                );
                for (const items of batch) skills.push(...items);
            }
            check(lc);
            return { skills, unavailable, hasMore: page.hasMore, cursor: page.cursor ?? null };
        },
        skillsSource: async (input: unknown) => {
            const lc = wallet();
            const parsed = z
                .object({ id: z.string().min(1).max(1000) })
                .strict()
                .safeParse(input);
            if (!parsed.success) throw new LearnerFailure('unavailable');
            const records = await lc.index.LearnCloud.get({ id: parsed.data.id });
            check(lc);
            const record = records[0];
            if (
                !record ||
                record.id.startsWith('__verifiable_data_') ||
                !categories.has(text(record.category))
            )
                throw new LearnerFailure('unavailable');
            const value = await display(record as Row);
            check(lc);
            return value;
        },
        goalsRead: async () => (await readGoals(wallet())).value,
        goalsSave: async (input: unknown) => {
            const lc = wallet();
            if (busy) throw new LearnerFailure('busy');
            const parsed = z
                .object({
                    revision: z.string().length(64),
                    goals: z.array(z.string().max(4000)).max(200),
                })
                .strict()
                .safeParse(input);
            if (!parsed.success) throw new LearnerFailure('invalid');
            busy = true;
            try {
                const before = await readGoals(lc),
                    goals = parsed.data.goals;
                // Also reconciles a reply lost after a successful index write; do not issue twice.
                if (canonical(before.value.goals) === canonical(goals)) return before.value;
                if (before.value.revision !== parsed.data.revision)
                    throw new LearnerFailure('changed');
                for (const goal of goals)
                    if (
                        !before.value.goals.includes(goal) &&
                        (!goal.trim() ||
                            goal !== goal.trim() ||
                            goal.length > 35 ||
                            [...goal].some(
                                char => char.codePointAt(0)! < 32 || char.codePointAt(0) === 127
                            ))
                    )
                        throw new LearnerFailure('invalid');
                const payload = { ...before.payload, goals };
                const signed = await lc.invoke.issueCredential({
                    '@context': [
                        'https://www.w3.org/ns/credentials/v2',
                        {
                            VerifiableData:
                                'https://docs.learncard.com/schemas/credentials/verifiable-data#VerifiableData',
                            dataKey:
                                'https://docs.learncard.com/schemas/credentials/verifiable-data#dataKey',
                            dataPayload: {
                                '@id': 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataPayload',
                                '@type': '@json',
                            },
                        },
                    ],
                    type: ['VerifiableCredential', 'VerifiableData'],
                    issuer: lc.id.did(),
                    validFrom: new Date().toISOString(),
                    name: 'Career Goals',
                    description: 'Self-reported career goals and aspirations',
                    credentialSubject: { id: lc.id.did(), dataKey: goalKey, dataPayload: payload },
                });
                check(lc);
                const uri = await lc.store.LearnCloud.uploadEncrypted?.(signed);
                check(lc);
                if (!uri) throw new LearnerFailure('connection');
                // Best-effort conflict detection: the current index API has no compare-and-swap.
                const latest = await readGoals(lc);
                if (latest.value.revision !== before.value.revision)
                    throw new LearnerFailure('changed');
                const metadata = {
                    uri,
                    category: 'Goals',
                    title: `VerifiableData: ${goalKey}`,
                    verifiableData: payload,
                    issuanceDate: signed.validFrom ?? new Date().toISOString(),
                };
                try {
                    if (before.record)
                        await lc.index.LearnCloud.update(goalsIndexID, {
                            ...metadata,
                            sharedUris: {},
                        });
                    else await lc.index.LearnCloud.add({ id: goalsIndexID, ...metadata });
                    check(lc);
                } catch {
                    check(lc);
                    try {
                        const confirmed = await readGoals(lc);
                        if (
                            canonical(confirmed.payload) === canonical(payload) &&
                            confirmed.record?.uri === uri
                        )
                            return confirmed.value;
                    } catch {
                        check(lc);
                    }
                    throw new LearnerFailure('uncertain');
                }
                // Use our confirmed write receipt, not a fallible follow-up read that could imply failure.
                const revision = await digest({ uri, payload });
                check(lc);
                return { goals, revision };
            } finally {
                busy = false;
            }
        },
    };
};
