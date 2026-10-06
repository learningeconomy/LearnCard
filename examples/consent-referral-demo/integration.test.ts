import { afterAll, beforeAll, expect, test } from 'bun:test';
import { startDemo } from './server';

// Run explicitly with the three synthetic local APIs running; never targets production.
let demo: Awaited<ReturnType<typeof startDemo>>;
let token = '';
const choices = { name: true, email: false, receiveOutcomes: true, shareOutcomes: true };
type Snapshot = {
    ready: boolean;
    sharingActive: boolean;
    contract: { audienceVersion: number };
    request: { requestId: string; status: string; readStatus: string };
    reference: string;
    data: Record<
        string,
        {
            allowed: boolean;
            personal: Record<string, string>;
            records: number;
            credentials: { name: string; decrypted: boolean }[];
        }
    >;
    webhooks: { event: string; role: string; reference: string; verified: boolean }[];
    dismissed: boolean;
    outcome: { claimed: boolean; shared: boolean };
};
const state = async (): Promise<Snapshot> => {
    const response = await fetch(`${demo.url}/api/state`);
    expect(response.status).toBe(200);
    return response.json();
};
const action = async (
    name: string,
    payload: Record<string, unknown> = {},
    expectedStatus = 200
): Promise<Snapshot> => {
    const response = await fetch(`${demo.url}/api/action`, {
        method: 'POST',
        headers: { Origin: demo.url, 'Content-Type': 'application/json', 'X-Demo-Token': token },
        body: JSON.stringify({ action: name, ...payload }),
    });
    const body = await response.json();
    if (response.status !== expectedStatus)
        throw new Error(`${name}: ${response.status} ${body.error ?? 'Unexpected response'}`);
    return body;
};
const accept = (snapshot: Snapshot, selected = choices) =>
    action('accept', {
        choices: selected,
        expectedRequestId: snapshot.request.requestId,
        audienceVersion: snapshot.contract.audienceVersion,
    });
beforeAll(async () => {
    demo = await startDemo({ port: 8920, webhookPort: 8921 });
    const html = await (await fetch(demo.url)).text();
    token = html.match(/name="demo-token" content="([^"]+)"/)![1];
});
afterAll(() => demo?.stop());

test('local actions reject foreign origins, missing tokens and forged webhooks', async () => {
    for (const headers of [
        { Origin: 'https://example.test', 'X-Demo-Token': token },
        { Origin: demo.url, 'X-Demo-Token': '' },
    ]) {
        const response = await fetch(`${demo.url}/api/action`, {
            method: 'POST',
            headers,
            body: '{"action":"setup"}',
        });
        expect(response.status).toBe(403);
    }
    const fake = await fetch('http://localhost:8921/learner', {
        method: 'POST',
        headers: { Authorization: 'Bearer forged' },
        body: '{}',
    });
    expect(fake.status).toBe(400);
    expect((await state()).webhooks).toHaveLength(0);
});

test('real referral APIs enforce selected data, claim before sharing, withdrawal and recipient removal', async () => {
    let snapshot = await action('setup');
    expect(snapshot.sharingActive).toBe(false);
    expect(Object.values(snapshot.data).every(data => data.records === 0)).toBe(true);
    snapshot = await action('send');
    snapshot = await action('seen');
    expect(snapshot.request.readStatus).toBe('seen');
    snapshot = await accept(snapshot);
    expect(snapshot.request.status).toBe('accepted');
    for (const data of Object.values(snapshot.data)) {
        expect(data.personal).toEqual({ name: 'Alex Morgan' });
        expect(data.credentials).toHaveLength(0);
    }
    snapshot = await action('issue');
    expect(snapshot.outcome.claimed).toBe(false);
    expect(Object.values(snapshot.data).every(data => data.credentials.length === 0)).toBe(true);
    snapshot = await action('claim');
    for (const data of Object.values(snapshot.data))
        expect(data.credentials).toEqual([{ name: 'Career services enrollment', decrypted: true }]);
    const deadline = Date.now() + 20_000;
    while (
        !['partner', 'referrer'].every(role =>
            snapshot.webhooks.some(
                event => event.role === role && event.event === 'credentials_synced'
            )
        ) &&
        Date.now() < deadline
    ) {
        await Bun.sleep(500);
        snapshot = await state();
    }
    for (const role of ['partner', 'referrer'])
        expect(
            snapshot.webhooks.some(
                event =>
                    event.role === role &&
                    event.event === 'credentials_synced' &&
                    event.reference === snapshot.reference &&
                    event.verified
            )
        ).toBe(true);
    snapshot = await action('permissions', {
        choices: { ...choices, name: false, email: true, shareOutcomes: false },
    });
    for (const data of Object.values(snapshot.data)) {
        expect(data.personal).toEqual({ email: 'alex@example.test' });
        expect(data.credentials).toHaveLength(0);
    }
    snapshot = await action('withdraw');
    expect(Object.values(snapshot.data).every(data => data.records === 0)).toBe(true);
    await action('fresh');
    snapshot = await action('send');
    await accept(snapshot);
    snapshot = await action('removeRecipient');
    expect(snapshot.data.referrer.allowed).toBe(false);
    expect(snapshot.data.referrer.records).toBe(0);
    expect(snapshot.data.partner.personal).toEqual({ name: 'Alex Morgan' });
    expect(JSON.stringify(snapshot)).not.toMatch(/privateKey|Bearer |"seed"/);
}, 120_000);

test('dismissal preserves the invitation; denial and cancellation cannot become consent', async () => {
    await action('fresh');
    await action('send');
    let snapshot = await action('dismiss');
    expect(snapshot.dismissed).toBe(true);
    expect(snapshot.request.status).toBe('pending');
    snapshot = await action('reopen');
    expect(snapshot.dismissed).toBe(false);
    snapshot = await action('decline');
    expect(snapshot.request.status).toBe('denied');
    expect(snapshot.sharingActive).toBe(false);
    await action('fresh');
    const reviewed = await action('send');
    await action('seen');
    await action('cancel');
    await action(
        'accept',
        {
            choices,
            expectedRequestId: reviewed.request.requestId,
            audienceVersion: reviewed.contract.audienceVersion,
        },
        409
    );
    snapshot = await state();
    expect(snapshot.request.status).toBe('cancelled');
    expect(snapshot.sharingActive).toBe(false);
    expect(Object.values(snapshot.data).every(data => data.records === 0)).toBe(true);
    await action('fresh');
    snapshot = await action('send');
    await accept(snapshot, { ...choices, receiveOutcomes: false, shareOutcomes: false });
    await action('issue', {}, 400);
    snapshot = await state();
    expect(snapshot.outcome).toBeUndefined();
}, 120_000);
