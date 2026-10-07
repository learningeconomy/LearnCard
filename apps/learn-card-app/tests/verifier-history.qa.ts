import { randomUUID } from 'node:crypto';
import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';
import { mockLaunchDarkly } from './route.helpers';
import { waitForAuthenticatedState } from './test.helpers';
import { TEST_USER_PROFILE_ID } from './constants';

type Fixture = typeof import('./fixtures/verifier-history-browser');

test('verifier history: off/on, three transports, controls and paging @mocked', async ({
    page,
}, info) => {
    const qa = <K extends keyof Fixture>(
        method: K,
        arg?: string | boolean
    ): Promise<Awaited<ReturnType<Fixture[K]>>> =>
        page.evaluate(
            async ({ method: selectedMethod, arg: argument }) => {
                const fixturePath = '/tests/fixtures/verifier-history-browser.ts';
                const fixture = await import(/* @vite-ignore */ fixturePath);
                return Reflect.apply(
                    fixture[selectedMethod],
                    null,
                    argument === undefined ? [] : [argument]
                );
            },
            { method, arg }
        );
    const nav = async (path: string) => {
        await qa('navigate', path);
    };
    const section = page.locator('section[aria-labelledby="verifier-history-title"]');
    const openHistory = async () => {
        await nav('/privacy-and-data');
        await expect(section).toBeVisible();
        const open = section.getByRole('button', { name: 'Open private history', exact: true });
        if (await open.isVisible()) await open.click();
        await expect(section.getByRole('checkbox')).toBeVisible();
    };
    const refresh = async () => {
        await section.getByRole('button', { name: 'Refresh', exact: true }).click();
        await expect(section.getByRole('button', { name: 'Refresh', exact: true })).toBeEnabled();
    };
    const setRecording = async (enabled: boolean) => {
        const checkbox = section.getByRole('checkbox');
        await expect(checkbox).toBeEnabled();
        if ((await checkbox.isChecked()) !== enabled) await checkbox.click();
        await expect.poll(async () => (await qa('status')).enabled).toBe(enabled);
        await expect(checkbox).toBeChecked({ checked: enabled });
    };
    const mock = await installNetwork(page);
    await mockLaunchDarkly(page, { shareMultipleEnabled: { value: true } });
    mock.on('utilities.getChallenges', () => Array.from({ length: 100 }, () => randomUUID()));
    mock.on('utilities.getEncryptionKey', () => 'a'.repeat(64));
    const profile = {
        profileId: TEST_USER_PROFILE_ID,
        displayName: 'QA Learner',
        did: `did:web:localhost%3A4000:users:${TEST_USER_PROFILE_ID}`,
        dob: '1990-01-01',
        country: 'US',
        shortBio: '',
        bio: '',
    };
    mock.on('profile.getProfile', () => profile);
    mock.on('profile.createProfile', () => profile.did);
    mock.on('profile.updateProfile', () => true);
    mock.on('profile.pendingConnectionPrompts', () => []);
    mock.on('user.getDids', () => [
        profile.did,
        'did:key:z6Mkv1o2GEgtXjFdEMfLtupcKhGRydM8V7VHzjiN7Uh4AHoqH',
    ]);
    mock.on('user.addDid', () => true);
    mock.on('index.get', () => ({ records: [], hasMore: false }));
    mock.on('index.count', () => 0);
    for (const name of [
        'contracts.getConsentedContracts',
        'contracts.getConsentFlowCredentials',
        'contracts.getAllCredentialsForTerms',
        'boost.getPaginatedBoosts',
        'skillFrameworks.getAllAvailableFrameworks',
        'activity.getMyActivities',
        'shareLinks.list',
        'shareLinks.getShareLinks',
    ])
        mock.on(name, () => ({ records: [], hasMore: false }));
    mock.on('contracts.getAllContractRequestsForProfile', () => []);
    mock.on('notifications.notifications', () => ({ records: [], hasMore: false }));
    mock.on('notifications.queryNotifications', () => ({ records: [], hasMore: false }));
    mock.on('inbox.finalize', () => ({
        processed: 0,
        claimed: 0,
        errors: 0,
        guardianPending: 0,
        verifiableCredentials: [],
        deliveries: [],
    }));
    mock.on('inbox.getMyInboxDeliveries', () => ({ records: [], hasMore: false }));
    let oidSends = 0,
        vcSends = 0;
    await page.route('https://verifier.qa.invalid/**', async route => {
        const cors = {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*',
        };
        if (route.request().method() === 'OPTIONS')
            return route.fulfill({ status: 204, headers: cors });
        if (route.request().url().includes('/vc-api')) {
            const body = route.request().postDataJSON();
            if (body.verifiablePresentation) {
                vcSends++;
                await qa('markTransport');
                return route.fulfill({ status: 200, json: {}, headers: cors });
            }
            return route.fulfill({
                json: {
                    verifiablePresentationRequest: {
                        challenge: 'qa-vc-api',
                        domain: 'https://verifier.qa.invalid',
                        query: [
                            {
                                type: 'QueryByExample',
                                credentialQuery: [
                                    {
                                        reason: 'QA eligibility check',
                                        example: { type: 'UniversityDegreeCredential' },
                                    },
                                ],
                            },
                        ],
                    },
                },
                headers: cors,
            });
        }
        oidSends++;
        await qa('markTransport');
        await route.fulfill({ status: 200, json: {}, headers: cors });
    });
    await waitForAuthenticatedState(
        page,
        { path: '/wallet', profileId: TEST_USER_PROFILE_ID },
        60_000
    );
    await expect.poll(() => qa('ready'), { timeout: 60_000 }).toBe(true);
    await qa('install');
    const oidUri = () => {
        const params = new URLSearchParams({
            response_type: 'vp_token',
            client_id: 'https://verifier.qa.invalid',
            client_id_scheme: 'redirect_uri',
            response_mode: 'direct_post',
            response_uri: 'https://verifier.qa.invalid/oid-response',
            nonce: randomUUID(),
            client_metadata: JSON.stringify({ client_name: 'QA University verifier' }),
            presentation_definition: JSON.stringify({
                id: randomUUID(),
                purpose: 'Verify education for the QA application',
                input_descriptors: [
                    {
                        id: 'degree',
                        name: 'University diploma',
                        constraints: {
                            fields: [
                                {
                                    path: ['$.type'],
                                    filter: {
                                        type: 'array',
                                        contains: { const: 'UniversityDegreeCredential' },
                                    },
                                },
                            ],
                        },
                    },
                ],
            }),
        });
        return '/oid4vp?request=' + encodeURIComponent('openid4vp://authorize?' + params);
    };
    const oidStart = async () => {
        await nav(oidUri());
        await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeEnabled({
            timeout: 60_000,
        });
    };
    const oidFinish = async () => {
        await expect(
            page.getByRole('heading', { name: 'Credentials shared', exact: true })
        ).toBeVisible({ timeout: 60_000 });
    };
    const oid = async () => {
        await oidStart();
        await page.getByRole('button', { name: 'Share', exact: true }).click();
        await oidFinish();
    };
    const selectAndReview = async () => {
        const checkbox = page.getByRole('checkbox', { name: /QA University Diploma/ });
        await expect(checkbox).toBeVisible();
        await checkbox.check();
        await page.getByRole('button', { name: 'Review', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeEnabled();
    };
    const vc = async () => {
        const before = vcSends;
        await nav(
            '/request?vc_request_url=' +
                encodeURIComponent('https://verifier.qa.invalid/vc-api?run=' + randomUUID())
        );
        await selectAndReview();
        await page.getByRole('button', { name: 'Share', exact: true }).click();
        await expect.poll(() => vcSends).toBe(before + 1);
        await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeHidden();
    };
    const chapi = async () => {
        const before = (await qa('status')).handoffs;
        await nav('/get');
        await selectAndReview();
        await page.getByRole('button', { name: 'Share', exact: true }).click();
        await expect.poll(async () => (await qa('status')).handoffs).toBe(before + 1);
        await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeHidden();
    };
    await test.step('Recording defaults off; no history storage calls in any send path', async () => {
        await openHistory();
        await expect(section.getByRole('checkbox')).not.toBeChecked();
        for (const [name, submit] of [
            ['OID4VP', oid],
            ['VC-API', vc],
            ['CHAPI', chapi],
        ] as const) {
            await test.step(name, async () => {
                await qa('resetCalls');
                await submit();
                const state = await qa('status');
                expect(state.calls).toEqual(['transport']);
                expect(state.receipts).toHaveLength(0);
            });
        }
    });
    await test.step('Opt in; record after transport with correct handoff wording', async () => {
        await openHistory();
        await setRecording(true);
        for (const [name, submit] of [
            ['OID4VP', oid],
            ['VC-API', vc],
            ['CHAPI', chapi],
        ] as const) {
            await test.step(name, async () => {
                const before = (await qa('status')).receipts.length;
                await qa('resetCalls');
                await submit();
                await expect
                    .poll(async () => (await qa('status')).receipts.length)
                    .toBe(before + 1);
                expect((await qa('status')).calls[0]).toBe('transport');
            });
        }
        await openHistory();
        await expect(section.getByRole('listitem')).toHaveCount(3);
        const state = await qa('status');
        expect(state.receipts.map(r => [r.protocol, r.outcome]).sort()).toEqual([
            ['chapi', 'handed-off'],
            ['oid4vp', 'sent'],
            ['vc-api', 'sent'],
        ]);
        expect(state.plaintextLeak).toBe(false);
        expect(state.privateSession).toBe(true);
    });
    await test.step('Turning off preserves history; cancel review sends nothing', async () => {
        await setRecording(false);
        await expect(section.getByRole('listitem')).toHaveCount(3);
        const before = (await qa('status')).handoffs;
        await nav('/get');
        await selectAndReview();
        await page.getByRole('button', { name: 'Go back', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Review', exact: true })).toBeVisible();
        expect((await qa('status')).handoffs).toBe(before);
    });
    await test.step('Five-entry preview, 20 per modal page; paging makes no storage reads', async () => {
        await openHistory();
        await setRecording(true);
        await qa('addReminders');
        await refresh();
        await expect(section.getByRole('listitem')).toHaveCount(5);
        await page.setViewportSize({ width: 1440, height: 1800 });
        const previewEntry = section
            .getByRole('button', { name: /View credentials shared with/ })
            .first();
        const previewReads = (await qa('status')).reads;
        await previewEntry.press('Enter');
        await expect(previewEntry).toHaveAttribute('aria-expanded', 'true');
        await expect(
            section.getByRole('list', { name: 'Recorded credential names' }).getByRole('listitem')
        ).toHaveCount(3);
        expect((await qa('status')).reads).toBe(previewReads);
        await info.attach('Five-entry history preview', {
            body: await section.screenshot({ animations: 'disabled' }),
            contentType: 'image/png',
        });
        await previewEntry.press('Space');
        await expect(previewEntry).toHaveAttribute('aria-expanded', 'false');
        await page.setViewportSize({ width: 1280, height: 900 });
        await section.getByRole('button', { name: 'View all 25', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Shared with verifiers', exact: true });
        await expect(dialog.getByRole('listitem')).toHaveCount(20);
        await expect(dialog).toHaveCSS('opacity', '1');
        const modalEntry = dialog
            .getByRole('button', { name: /View credentials shared with/ })
            .first();
        const detailReads = (await qa('status')).reads;
        await modalEntry.click();
        await expect(
            dialog.getByRole('list', { name: 'Recorded credential names' }).getByRole('listitem')
        ).toHaveCount(3);
        expect((await qa('status')).reads).toBe(detailReads);
        await info.attach('Desktop full history', {
            body: await page.screenshot({ animations: 'disabled' }),
            contentType: 'image/png',
        });
        await modalEntry.click();
        const before = (await qa('status')).reads;
        await dialog.getByRole('button', { name: 'Next', exact: true }).click();
        await expect(dialog.getByRole('listitem')).toHaveCount(5);
        await expect(dialog).toContainText('Page 2 of 2');
        await dialog.getByRole('button', { name: 'Previous', exact: true }).click();
        await expect(dialog.getByRole('listitem')).toHaveCount(20);
        expect((await qa('status')).reads).toBe(before);
        await dialog
            .getByRole('button', { name: /Delete entry/ })
            .first()
            .click();
        await expect(section).toContainText('Showing 5 of 24 entries');
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await section.getByRole('button', { name: 'View all 24', exact: true }).click();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await section.getByRole('button', { name: 'View all 24', exact: true }).click();
        await expect(dialog).toBeVisible();
        await qa('managed', true);
        await expect(dialog).toBeHidden();
        await expect(section).toContainText('History is unavailable for managed accounts.');
        await qa('managed', false);
        await openHistory();
    });
    await test.step('Mobile history controls; Clear keeps consent and the credential', async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await section.getByRole('button', { name: 'View all 24', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Shared with verifiers', exact: true });
        await expect(dialog.getByRole('button', { name: 'Next', exact: true })).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
            390
        );
        await expect(dialog).toHaveCSS('opacity', '1');
        const mobileEntry = dialog
            .getByRole('button', { name: /View credentials shared with/ })
            .first();
        const mobileReads = (await qa('status')).reads;
        await mobileEntry.press('Enter');
        await expect(
            dialog.getByRole('list', { name: 'Recorded credential names' }).getByRole('listitem')
        ).toHaveCount(3);
        expect((await qa('status')).reads).toBe(mobileReads);
        await info.attach('Mobile full history', {
            body: await page.screenshot({ animations: 'disabled' }),
            contentType: 'image/png',
        });
        await dialog.getByRole('button', { name: 'Clear history', exact: true }).click();
        await expect(dialog.getByRole('listitem')).toHaveCount(0);
        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await expect(section.getByRole('checkbox')).toBeChecked();
        await expect(section.getByRole('listitem')).toHaveCount(0);
        await nav('/get');
        await expect(page.getByRole('checkbox', { name: /QA University Diploma/ })).toBeVisible();
    });
    expect(oidSends).toBe(2);
    expect(vcSends).toBe(2);
    await info.attach('Synthetic QA evidence', {
        body: JSON.stringify(await qa('status'), null, 2),
        contentType: 'application/json',
    });
});
