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
 *
 * The agent's did:key comes from a random seed made on first run and kept in a 0600
 * file in $TMPDIR, so `link` and `read` are the same agent only with the same $TMPDIR.
 * The seed is never printed.
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

    await mine.grants.revoke.mutate({ grantId: grant.grantId });
    step('stopped sharing');
    const denied = await read(hcp, grant.grantId).then(
        () => 'allowed (unexpected)',
        (error: { data?: { hcp?: { type?: string } } }) => error.data?.hcp?.type ?? 'error'
    );
    step(`agent read after stop: ${denied}`);
    if (denied !== 'scope-denied') throw new Error('agent could still read after revoke');

    const { events } = await mine.audit.list.query({ limit: 50 });
    step(
        `activity: ${events
            .map(e => e.eventType)
            .reverse()
            .join(' → ')}`
    );
    step(`active grants left: ${(await mine.grants.list.query({ status: 'active' })).length}`);
};

const main = async (): Promise<void> => {
    assertLocal();
    const [command, grantId] = process.argv.slice(2);
    if (command === 'link') {
        const { did } = await agentHcp();
        console.log(consentLink(did));
    } else if (command === 'read' && grantId) {
        const { hcp } = await agentHcp();
        console.log(JSON.stringify(await read(hcp, grantId), null, 2));
    } else if (command === 'smoke') {
        await smoke();
    } else {
        console.log(
            'Usage: bun --conditions=development tests/e2e/scripts/hcp-demo-agent.ts <link | read <grantId> | smoke>'
        );
        process.exitCode = 1;
    }
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
