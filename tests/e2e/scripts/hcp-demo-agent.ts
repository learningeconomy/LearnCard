/**
 * Local-only HCP demo agent (LC-2424). Never point it at a hosted brain.
 *
 * Run from the repo root. `--conditions=development` is required: it loads the
 * workspace packages from source, since their dist/ is not built in a fresh checkout.
 * Plain `bun run` fails with "Cannot find module '@learncard/init'".
 *
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts link            # print a consent link
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts read <grantId>  # read as the agent
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts smoke           # whole flow, no app
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts contract        # contract consent link (LC-2421)
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts contract-smoke  # contract flow, no app
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts suggest-link    # consent link with suggest=1 (LC-2423)
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts suggest <grantId> [text…]  # write a suggestion under a grant
 *   bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts suggest-smoke   # suggestions (LC-2423), no app
 *
 * The agent's did:key comes from a random seed made on first run and kept in a 0600
 * file in $TMPDIR, so `link` and `read` are the same agent only with the same $TMPDIR.
 * The seed is never printed. `contract` makes a throwaway operator (a fresh seed,
 * never saved or printed) with a LearnCard profile that owns a ConsentFlow contract
 * whose HCP section names this agent.
 * Env: HCP_BRAIN_URL (default http://localhost:4000/trpc), HCP_APP_URL (default
 * http://localhost:3000).
 */
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initLearnCard } from '@learncard/init';

const BRAIN = process.env.HCP_BRAIN_URL ?? 'http://localhost:4000/trpc';
const APP = process.env.HCP_APP_URL ?? 'http://localhost:3000';
const NAME = 'Demo Tutor';
const CATEGORIES = ['goals_and_constraints', 'education_learner_profile'];
const PURPOSE = {
    code: 'https://demo-tutor.example/purposes/study-help',
    description: 'Help you study',
};
const SEED_FILE = join(tmpdir(), 'lc-hcp-demo-agent.seed');
const ENTRY_SCHEMA = 'https://hcp.example/spec/entry/2.0';
const GENERAL = 'https://hcp.example/spec/profiles/general-context/2.0';

const assertLocal = (): void => {
    const host = new URL(BRAIN).hostname;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
        throw new Error('hcp-demo-agent only talks to a brain on localhost.');
    }
};

const didkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

const wallet = (seed: string) => initLearnCard({ seed, network: BRAIN, didkit });

const SEED = /^[0-9a-f]{64}$/;

const agentSeed = async (): Promise<string> => {
    const seed = randomBytes(32).toString('hex');
    try {
        // 'wx': never overwrite, never follow a planted file.
        await writeFile(SEED_FILE, seed, { mode: 0o600, flag: 'wx' });
        return seed;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    const saved = (await readFile(SEED_FILE, 'utf8')).trim();
    if (!SEED.test(saved)) throw new Error(`${SEED_FILE} is not a demo agent seed; delete it`);
    return saved;
};

export const consentLink = (clientDid: string): string =>
    `${APP}/hcp/connect?${new URLSearchParams({
        client: clientDid,
        name: NAME,
        categories: CATEGORIES.join(','),
        purpose: PURPOSE.description,
        purposeCode: PURPOSE.code,
        duration: '1h',
    })}`;

/** Same as `link`, plus `suggest=1` so Allow grants write with canWrite false (LC-2423). */
export const suggestConsentLink = (clientDid: string): string =>
    `${consentLink(clientDid)}&suggest=1`;

type Hcp = Awaited<ReturnType<Awaited<ReturnType<typeof wallet>>['invoke']['getHcpClient']>>;

const agentHcp = async (): Promise<{ did: string; hcp: Hcp }> => {
    const agent = await wallet(await agentSeed());
    // Agents have no profile: use the raw client, not getHcpClient's profile check.
    return { did: agent.id.did(), hcp: agent.invoke.getLCNClient().hcp.v1 };
};

const read = async (hcp: Hcp, grantId: string) => {
    const result = await hcp.entries.query.query({
        grantId,
        query: 'how do I learn best',
        purpose: PURPOSE.code,
        maxEntries: 20,
    });
    return result.entries.map(entry => ({
        categories: entry.classification.categories,
        text: String(entry.content.value).slice(0, 80),
    }));
};

const smoke = async (): Promise<void> => {
    const step = (text: string) => console.log(`- ${text}`);
    const person = await wallet(randomBytes(32).toString('hex'));
    const profileId = `hcp-demo-${randomBytes(4).toString('hex')}`;
    await person.invoke.createProfile({
        profileId,
        displayName: 'HCP Demo Person',
        shortBio: '',
        bio: '',
    });
    step(`person profile ${profileId} created`);
    const mine = await person.invoke.getHcpClient();
    const { subject } = await mine.entries.list.query({});
    step(`subject id is did:${subject.id.split(':')[1]} (profile.did), not the did:web profile id`);

    const add = (value: string, category: string) =>
        mine.entries.create.mutate({
            schema: ENTRY_SCHEMA,
            subject,
            content: { profile: GENERAL, value },
            classification: { categories: [category] },
            assertion: { declarationType: 'person-declared' },
            record: { provenance: { source: 'hcp-demo-agent' } },
        });
    await add('I learn best with short worked examples', 'education_learner_profile');
    await add('Pass my algebra final in June', 'goals_and_constraints');
    await add('Prefers email over calls', 'general_preferences');
    step(`added 3 entries; list shows ${(await mine.entries.list.query({})).entries.length}`);

    const { did, hcp } = await agentHcp();
    const grant = await mine.grants.create.mutate({
        client: { id: did, name: NAME },
        access: [{ actions: ['read'], categories: CATEGORIES, purposes: [PURPOSE] }],
        grantType: 'temporary',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    step(`allowed ${NAME}: ${grant.status}, expires ${grant.expiresAt}`);

    const seen = await read(hcp, grant.grantId);
    step(
        `agent read ${seen.length} entries in ${[...new Set(seen.flatMap(s => s.categories))].join(', ')}`
    );
    if (seen.some(s => s.categories.includes('general_preferences')))
        throw new Error('agent saw a category it was not granted');

    // LC-2422: another app presenting this grant gets the same refusal, and is logged.
    const stranger = await wallet(randomBytes(32).toString('hex'));
    const strangerResult = await read(stranger.invoke.getLCNClient().hcp.v1, grant.grantId).then(
        () => 'allowed (unexpected)',
        (error: { data?: { hcp?: { type?: string } } }) => error.data?.hcp?.type ?? 'error'
    );
    step(`another app using the grant: ${strangerResult}`);
    if (strangerResult !== 'scope-denied')
        throw new Error("another app could use the agent's grant");

    await mine.grants.revoke.mutate({ grantId: grant.grantId });
    step('stopped sharing');
    const denied = await read(hcp, grant.grantId).then(
        () => 'allowed (unexpected)',
        (error: { data?: { hcp?: { type?: string } } }) => error.data?.hcp?.type ?? 'error'
    );
    step(`agent read after stop: ${denied}`);
    if (denied !== 'scope-denied') throw new Error('agent could still read after revoke');

    const { events } = await mine.audit.list.query({ limit: 50 });
    // The brain's LearnCard read-denied event type is a URI; show its last segment.
    const label = (eventType: string) => eventType.split('/').at(-1)!;
    step(
        `activity: ${events
            .map(e => label(e.eventType))
            .reverse()
            .join(' → ')}`
    );
    // LC-2422: the agent's read is in the person's log, with what it disclosed.
    const agentRead = events.find(
        e => e.eventType === 'context.read' && e.grantId === grant.grantId
    );
    if (!agentRead) throw new Error("the agent's read is missing from the activity log");
    step(
        `logged read: ${agentRead.disclosed?.length ?? 0} entries disclosed in ${agentRead.categories.join(', ')}`
    );
    if ((agentRead.disclosed?.length ?? 0) !== seen.length)
        throw new Error('the logged read does not match what the agent received');
    if (!events.some(e => label(e.eventType) === 'read-denied' && e.grantId === grant.grantId))
        throw new Error('the refused read after stop is missing from the activity log');
    const strangerDid = stranger.id.did();
    const strangerLogged = events.find(
        e =>
            label(e.eventType) === 'read-denied' &&
            e.participants.initiator.id === strangerDid &&
            e.data.reason === 'not-grant-client'
    );
    if (!strangerLogged) throw new Error("another app's attempt is missing from the activity log");
    step(`logged another app's attempt as ${String(strangerLogged.data.reason)}`);
    step(`active grants left: ${(await mine.grants.list.query({ status: 'active' })).length}`);
};

/** LC-2421: the HCP section an operator's contract offers, naming the agent. */
const hcpSection = (agentDid: string, categories = CATEGORIES) => ({
    agents: [agentDid],
    categories,
    actions: ['read' as const],
    purposes: [PURPOSE],
    duration: '1h' as const,
});

/** A throwaway operator profile that owns a contract naming the agent. */
const operatorContract = async (agentDid: string) => {
    const operator = await wallet(randomBytes(32).toString('hex'));
    const profileId = `hcp-operator-${randomBytes(4).toString('hex')}`;
    await operator.invoke.createProfile({
        profileId,
        displayName: 'Demo Tutor Co',
        shortBio: '',
        bio: '',
    });
    const uri = await operator.invoke.createContract({
        name: NAME,
        contract: { hcp: hcpSection(agentDid) },
    });
    return { operator, profileId, uri };
};

export const contractLink = (contractUri: string): string =>
    `${APP}/hcp/connect?${new URLSearchParams({ contract: contractUri })}`;

const contractSmoke = async (): Promise<void> => {
    const step = (text: string) => console.log(`- ${text}`);
    const person = await wallet(randomBytes(32).toString('hex'));
    await person.invoke.createProfile({
        profileId: `hcp-demo-${randomBytes(4).toString('hex')}`,
        displayName: 'HCP Demo Person',
        shortBio: '',
        bio: '',
    });
    const mine = await person.invoke.getHcpClient();
    const { subject } = await mine.entries.list.query({});
    const add = (value: string, category: string) =>
        mine.entries.create.mutate({
            schema: ENTRY_SCHEMA,
            subject,
            content: { profile: GENERAL, value },
            classification: { categories: [category] },
            assertion: { declarationType: 'person-declared' },
            record: { provenance: { source: 'hcp-demo-agent' } },
        });
    await add('I learn best with short worked examples', 'education_learner_profile');
    await add('Pass my algebra final in June', 'goals_and_constraints');
    await add('Prefers email over calls', 'general_preferences');

    const { did, hcp } = await agentHcp();
    const { operator, profileId, uri } = await operatorContract(did);
    step(`operator ${profileId} owns contract ${uri.split(':').at(-1)} naming the agent`);

    const offer = await mine.grants.offer.query({ contractUri: uri });
    step(`offer v${offer.version}: "${offer.name}" by ${offer.owner.displayName}`);
    const allow = (version: number) =>
        mine.grants.create.mutate({
            client: { id: did },
            source: { type: 'consentflow', contractUri: uri, contractVersion: version },
        });
    const categoriesOf = async (grantId: string) =>
        [...new Set((await read(hcp, grantId)).flatMap(entry => entry.categories))].sort();

    const first = await allow(offer.version);
    step(
        `allowed: grant pinned to v${first.source.type === 'consentflow' ? first.source.contractVersion : '?'}, client name "${first.client.name}"`
    );
    step(`agent reads ${(await categoriesOf(first.grantId)).join(', ')}`);

    await operator.invoke.updateContract(uri, {
        contract: { hcp: hcpSection(did, ['education_learner_profile']) },
    });
    const narrowed = await categoriesOf(first.grantId);
    step(`operator narrowed (v2, relaxed): agent reads ${narrowed.join(', ')}`);
    if (narrowed.includes('goals_and_constraints'))
        throw new Error('a narrowing version did not reach the existing grant');

    await operator.invoke.updateContract(
        uri,
        { contract: { hcp: hcpSection(did, [...CATEGORIES, 'general_preferences']) } },
        { reason: 'Adds your preferences' }
    );
    const pinned = await categoriesOf(first.grantId);
    step(`operator widened (v3): existing grant still reads ${pinned.join(', ')}`);
    if (pinned.includes('general_preferences'))
        throw new Error('a widening version reached the existing grant without consent');

    const second = await allow(3);
    const widened = await categoriesOf(second.grantId);
    step(`person allowed v3: new grant reads ${widened.join(', ')}`);
    if (!widened.includes('general_preferences'))
        throw new Error('re-consent did not grant the wider access');
    const old = await mine.grants.get.query({ grantId: first.grantId });
    step(`earlier grant is ${old.status}`);
    if (old.status !== 'revoked') throw new Error('the earlier grant was not replaced');

    const stranger = await wallet(randomBytes(32).toString('hex'));
    const strangerResult = await read(stranger.invoke.getLCNClient().hcp.v1, second.grantId).then(
        () => 'allowed (unexpected)',
        (error: { data?: { hcp?: { type?: string } } }) => error.data?.hcp?.type ?? 'error'
    );
    step(`another DID using the contract grant: ${strangerResult}`);
    if (strangerResult !== 'scope-denied') throw new Error('another DID used the contract grant');
    step(`contract link for the app: ${contractLink(uri)}`);
};

/**
 * LC-2423 hand-test: create a suggestion under an existing grant (from suggest-link Allow).
 * Resolves the subject via grants.get (clients may read their own grant).
 */
const suggestUnderGrant = async (grantId: string, value: string): Promise<unknown> => {
    const { hcp } = await agentHcp();
    const grant = await hcp.grants.get.query({ grantId });
    return hcp.entries.create.mutate({
        grantId,
        schema: ENTRY_SCHEMA,
        subject: grant.subject,
        content: { profile: GENERAL, value },
        classification: { categories: ['goals_and_constraints'] },
        assertion: { declarationType: 'person-declared' },
        record: { provenance: { source: 'hcp-demo-agent' } },
    });
};

/**
 * LC-2423: a write from a grant without canWrite lands as a suggestion the agent can't
 * read back until the person accepts it; a grant with canWrite writes directly.
 */
const suggestSmoke = async (): Promise<void> => {
    const step = (text: string) => console.log(`- ${text}`);
    const person = await wallet(randomBytes(32).toString('hex'));
    const profileId = `hcp-demo-${randomBytes(4).toString('hex')}`;
    await person.invoke.createProfile({
        profileId,
        displayName: 'HCP Demo Person',
        shortBio: '',
        bio: '',
    });
    const mine = await person.invoke.getHcpClient();
    const { did, hcp } = await agentHcp();
    const allow = (canWrite: boolean) =>
        mine.grants.create.mutate({
            client: { id: did, name: NAME },
            access: [{ actions: ['read', 'write'], categories: CATEGORIES, purposes: [PURPOSE] }],
            grantType: 'temporary',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            canWrite,
        });
    const write = (grant: { grantId: string; subject: { id: string } }, value: string) =>
        hcp.entries.create.mutate({
            grantId: grant.grantId,
            schema: ENTRY_SCHEMA,
            subject: grant.subject,
            content: { profile: GENERAL, value },
            classification: { categories: ['goals_and_constraints'] },
            assertion: { declarationType: 'person-declared' },
            record: { provenance: { source: 'hcp-demo-agent' } },
        });

    const suggesting = await allow(false);
    step(`allowed ${NAME} with canWrite ${suggesting.canWrite}`);
    const suggestion = await write(suggesting, 'Practice fractions twice a week');
    // Clients get a disclosure back; `suggested` says the person must accept it first.
    const isSuggested = (written: unknown) =>
        (written as { suggested?: boolean }).suggested === true;
    step(`agent wrote: ${isSuggested(suggestion) ? 'held as a suggestion' : 'added directly'}`);
    if (!isSuggested(suggestion)) throw new Error('the write was not a suggestion');
    if ((await read(hcp, suggesting.grantId)).length !== 0)
        throw new Error('the agent read back its own suggestion before it was accepted');
    step('agent reads nothing before the person accepts');

    const listed = (await mine.entries.list.query({})).entries.find(
        entry => entry.record.status === 'suggested'
    );
    if (!listed) throw new Error("the suggestion is missing from the person's list");
    await mine.entries.accept.mutate({ entryId: listed.id });
    const afterAccept = await read(hcp, suggesting.grantId);
    step(`person accepted; agent now reads ${afterAccept.length} entry`);
    if (afterAccept.length !== 1) throw new Error('the accepted suggestion is not readable');

    const dismissed = await write(suggesting, 'Skip homework on Fridays');
    const toDismiss = (await mine.entries.list.query({})).entries.find(
        entry => entry.record.status === 'suggested'
    );
    if (!toDismiss || !isSuggested(dismissed))
        throw new Error('the second write was not a suggestion');
    await mine.entries.withdraw.mutate({ entryId: toDismiss.id, reason: 'Dismissed' });
    step('person dismissed a second suggestion');

    const direct = await write(await allow(true), 'Finish the algebra unit by May');
    step(
        `with canWrite, agent wrote: ${isSuggested(direct) ? 'held as a suggestion' : 'added directly'}`
    );
    if (isSuggested(direct)) throw new Error('a canWrite grant did not write directly');
};

const main = async (): Promise<void> => {
    assertLocal();
    const [command, grantId, ...rest] = process.argv.slice(2);
    if (command === 'link') {
        const { did } = await agentHcp();
        console.log(consentLink(did));
    } else if (command === 'suggest-link') {
        const { did } = await agentHcp();
        console.log(suggestConsentLink(did));
    } else if (command === 'read' && grantId) {
        const { hcp } = await agentHcp();
        console.log(JSON.stringify(await read(hcp, grantId), null, 2));
    } else if (command === 'suggest' && grantId) {
        const value = rest.join(' ').trim() || 'Practice fractions twice a week';
        console.log(JSON.stringify(await suggestUnderGrant(grantId, value), null, 2));
    } else if (command === 'smoke') {
        await smoke();
    } else if (command === 'contract') {
        const { did } = await agentHcp();
        console.log(contractLink((await operatorContract(did)).uri));
    } else if (command === 'contract-smoke') {
        await contractSmoke();
    } else if (command === 'suggest-smoke') {
        await suggestSmoke();
    } else {
        console.log(
            'Usage: bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts <link | suggest-link | read <grantId> | suggest <grantId> [text…] | smoke | contract | contract-smoke | suggest-smoke>'
        );
        process.exitCode = 1;
    }
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
