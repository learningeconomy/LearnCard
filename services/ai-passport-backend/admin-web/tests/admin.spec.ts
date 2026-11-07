import { expect, test } from '@playwright/test';
const coverage = {
    observedAt: new Date().toISOString(),
    complete: true,
    totalRecords: 100,
    observedRecords: 100,
    inventoryLimit: 500,
    novaReady: 30,
    openaiOnly: 60,
    unresolved: 10,
    rollbackCopies: 20,
};
const status = {
    generation: 'openai1536',
    target: 'nova2-text-1024-index-retrieval-privacy-v1',
    enabled: false,
    dualWrite: false,
    fresh: true,
    csrf: 'fixture-token',
    jobs: [],
};
const headers = {
    'Access-Control-Allow-Origin': `http://localhost:${process.env.AIP_TEST_FRONTEND_PORT ?? '4321'}`,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Passport-CSRF',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
test('admin dashboard has inert defaults and recovers repeated/interrupted actions', async ({
    page,
}) => {
    let posts = 0,
        fail = false;
    const ids: string[] = [];
    await page.route('**/auth/session', route =>
        route.fulfill({
            headers,
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings**', async route => {
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        if (route.request().method() === 'GET')
            return route.fulfill({
                headers,
                json: route.request().url().endsWith('/coverage') ? coverage : status,
            });
        posts += 1;
        const body = route.request().postDataJSON();
        ids.push(body.requestId);
        expect(body.dryRun).toBe(true);
        expect(route.request().headers()['x-passport-csrf']).toBe('fixture-token');
        if (fail) {
            fail = false;
            return route.abort('failed');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        return route.fulfill({ status: 201, headers, json: {} });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Embedding migration' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create apply job' })).toBeDisabled();
    const login = new URL(
        (await page
            .getByRole('link', { name: 'Log in with service profile' })
            .getAttribute('href'))!
    );
    expect(new URL(login.searchParams.get('returnTo')!).pathname).toBe('/admin');
    expect(login.origin).toBe(new URL(page.url()).origin);
    expect(new URL(login.searchParams.get('returnTo')!).origin).toBe(login.origin);
    await page.getByRole('button', { name: 'Create dry-run' }).dblclick();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeEnabled();
    expect(posts).toBe(1);
    fail = true;
    await page.getByRole('button', { name: 'Create dry-run' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await page.getByRole('button', { name: 'Create dry-run' }).click();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeEnabled();
    expect(ids[1]).toBe(ids[2]);
    await page.screenshot({
        path: 'test-results/admin-desktop.png',
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
        path: 'test-results/admin-mobile.png',
        fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await page.reload();
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeEnabled();
});
test('old session asks for fresh profile login and denies mutation in the UI', async ({ page }) => {
    await page.route('**/auth/session', route =>
        route.fulfill({
            headers,
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings', route =>
        route.fulfill({ headers, json: { ...status, fresh: false } })
    );
    await page.route('**/admin/embeddings/coverage', route =>
        route.fulfill({ headers, json: coverage })
    );
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(
        page.getByText('Log in again with the configured service profile to perform actions.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeDisabled();
});

test('coverage updates from exclusive record counts, shows failure/empty/incomplete states and remains accessible on mobile', async ({
    page,
}) => {
    let authorized = true;
    let current = { ...coverage },
        failed = false,
        polls = 0;
    await page.route('**/auth/session', route =>
        route.fulfill({
            headers,
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings', route =>
        route.fulfill({
            headers,
            status: authorized ? 200 : 403,
            json: authorized ? status : { error: 'Configured service profile required' },
        })
    );
    await page.route('**/admin/embeddings/coverage', route => {
        polls += 1;
        return route.fulfill({
            headers,
            status: failed ? 503 : 200,
            json: failed ? { error: 'unavailable' } : current,
        });
    });
    await page.clock.install();
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('img', { name: 'Credential backfill coverage' })).toBeVisible();
    await expect(page.getByText('30%', { exact: true })).toBeVisible();
    current = { ...current, novaReady: 70, openaiOnly: 20, rollbackCopies: 60 };
    await page.clock.fastForward(16000);
    await expect(page.getByText('70%', { exact: true })).toBeVisible();
    failed = true;
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText('Update delayed', { exact: true })).toBeVisible();
    await expect(page.getByText('70%', { exact: true })).toBeVisible();
    failed = false;
    current = {
        ...current,
        complete: false,
        totalRecords: null as unknown as number,
    };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText('Inventory not confirmed', { exact: true })).toBeVisible();
    await expect(
        page.getByText(
            /Full inventory scan in progress: 100 credential records observed; total not confirmed/
        )
    ).toBeVisible();
    current = {
        ...coverage,
        totalRecords: 0,
        observedRecords: 0,
        novaReady: 0,
        openaiOnly: 0,
        unresolved: 0,
        rollbackCopies: 0,
    };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText('Inventory not confirmed', { exact: true })).toBeVisible();
    await expect(
        page.getByText(/0 persisted credential records in this observation/)
    ).toBeVisible();
    expect(polls).toBeGreaterThanOrEqual(5);
    current = { ...coverage, novaReady: 70, openaiOnly: 20, rollbackCopies: 60 };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByText('70%', { exact: true })).toBeVisible();
    await page.screenshot({
        path: 'test-results/admin-coverage-desktop.png',
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('img', { name: 'Credential backfill coverage' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await page.screenshot({
        path: 'test-results/admin-coverage-mobile.png',
        fullPage: true,
    });
    await page.getByRole('checkbox').focus();
    await expect(page.getByRole('checkbox')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox')).toBeChecked();
    authorized = false;
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(page.getByRole('img', { name: 'Credential backfill coverage' })).not.toBeVisible();
    await expect(
        page.getByText('Profile access changed. Log in again.', { exact: true })
    ).toBeVisible();
});

test('active provider reports degraded flag fallback independently of backfill copies', async ({
    page,
}) => {
    await page.route('**/auth/session', route =>
        route.fulfill({ headers, json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings', route =>
        route.fulfill({
            headers,
            json: {
                ...status,
                readControl: {
                    configured: 'nova1024v1',
                    effective: 'openai1536',
                    control: 'launchdarkly',
                    degraded: true,
                    reason: 'flag_evaluation_failed',
                },
            },
        })
    );
    await page.route('**/admin/embeddings/coverage', route =>
        route.fulfill({ headers, json: { ...coverage, novaReady: 70, openaiOnly: 20 } })
    );
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('region', { name: 'Active search provider' })).toContainText(
        'OpenAI · 1536 dimensions'
    );
    await expect(page.getByText(/Degraded control · safe OpenAI fallback/)).toBeVisible();
    await expect(page.getByText('70%', { exact: true })).toBeVisible();
});

test('backend handoff is consumed once, stripped from URL and followed by cookie-only reads', async ({
    page,
}) => {
    let handoffs = 0;
    await page.route('**/auth/handoff', route => {
        handoffs += 1;
        expect(route.request().postDataJSON().handoff).toBe('a'.repeat(64));
        expect(new URL(route.request().url()).origin).toBe('http://localhost:4349');
        return route.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } });
    });
    await page.route('**/auth/session', route =>
        route.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', route => {
        expect(route.request().headers().origin).toBeUndefined();
        return route.fulfill({
            json: route.request().url().endsWith('/coverage') ? coverage : status,
        });
    });
    await page.goto('/admin#ai_passport_handoff=' + 'a'.repeat(64));
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeEnabled();
    expect(new URL(page.url()).hash).toBe('');
    await page.reload();
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create dry-run' })).toBeEnabled();
    expect(handoffs).toBe(1);
});

test('skip diagnostics separate historical skips and dry-run observations without exposing unknown fields', async ({
    page,
}) => {
    await page.route('**/auth/session', route =>
        route.fulfill({
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    const plan = {
        embeddingRequests: 5,
        representationCalls: 1,
        embeddingUsdUpperEstimate: null,
    };
    await page.route('**/admin/embeddings**', route =>
        route.fulfill({
            json: route.request().url().endsWith('/coverage')
                ? coverage
                : {
                      ...status,
                      jobs: [
                          {
                              _id: 'apply',
                              dryRun: false,
                              state: 'paused',
                              kind: 'credentials',
                              scanned: 3,
                              written: 0,
                              skipped: 3,
                              errors: 0,
                              skipReasons: {
                                  missing_verification: 2,
                                  injected_private_text: 999,
                              },
                              plan,
                          },
                          {
                              _id: 'legacy-dry',
                              dryRun: true,
                              state: 'paused',
                              kind: 'credentials',
                              scanned: 1,
                              written: 0,
                              skipped: 1,
                              errors: 0,
                              plan,
                          },
                          {
                              _id: 'new-dry',
                              dryRun: true,
                              state: 'paused',
                              kind: 'credentials',
                              scanned: 1,
                              written: 0,
                              skipped: 0,
                              dryRunObserved: 1,
                              errors: 0,
                              plan,
                          },
                      ],
                  },
        })
    );
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(page.getByText('Missing verification metadata: 2')).toBeVisible();
    await expect(page.getByText('Historical skips without recorded reason: 1')).toBeVisible();
    await expect(
        page.getByText('1 scanned · 0 written · 1 observed without applying · 0 errors')
    ).toHaveCount(2);
    await expect(
        page.getByText(
            'Planning only; eligibility and provider access were not checked. No model or privacy calls.'
        )
    ).toHaveCount(2);
    await expect(page.getByText(/injected_private_text/)).toHaveCount(0);
});

test('legacy repair previews before explicit verify, displays aggregate exclusions and never starts embedding work', async ({
    page,
}) => {
    let candidate = false,
        repaired = 0;
    const actions: string[] = [];
    await page.route('**/auth/session', route =>
        route.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', async route => {
        const path = new URL(route.request().url()).pathname;
        if (route.request().method() === 'GET')
            return route.fulfill({
                json: path.endsWith('/coverage')
                    ? coverage
                    : {
                          ...status,
                          repairJobs: [
                              {
                                  _id: '11111111-1111-4111-8111-111111111111',
                                  state: 'paused',
                                  scanned: repaired,
                                  repaired,
                                  awaitingVerification: candidate,
                                  outcomes: repaired ? { repaired: 1, generated: 2 } : {},
                              },
                          ],
                      },
            });
        actions.push(path);
        if (path === '/admin/embeddings/legacy-repair/jobs') {
            expect(Object.keys(route.request().postDataJSON())).toEqual(['requestId']);
        }
        if (path.endsWith('/preview')) candidate = true;
        if (path.endsWith('/verify')) {
            candidate = false;
            repaired += 1;
        }
        await route.fulfill({ json: {} });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(
        page.getByRole('button', { name: 'Verify original and save metadata' })
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Create verify-only range' }).click();
    await page.getByRole('button', { name: 'Preview next legacy record' }).click();
    await expect(page.getByText('Eligible candidate previewed.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview next legacy record' })).toBeDisabled();
    await page.getByRole('button', { name: 'Verify original and save metadata' }).click();
    await expect(page.getByText('Verification metadata repaired: 1')).toBeVisible();
    await expect(page.getByText('Generated record requires separate provenance: 2')).toBeVisible();
    expect(actions).toEqual([
        '/admin/embeddings/legacy-repair/jobs',
        '/admin/embeddings/legacy-repair/jobs/11111111-1111-4111-8111-111111111111/preview',
        '/admin/embeddings/legacy-repair/jobs/11111111-1111-4111-8111-111111111111/verify',
    ]);
});

for (const scenario of ['bounded', 'pending navigation', 'cancel interrupted']) {
    test(`batch controls ${scenario} with exact sequence and no automatic recovery`, async ({
        page,
    }) => {
        const jobId = '11111111-1111-4111-8111-111111111111';
        let batch: any = null,
            starts = 0,
            advances = 0;
        let release!: () => void;
        const hold = new Promise<void>(r => {
            release = r;
        });
        await page.route('**/auth/session', r =>
            r.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
        );
        await page.route('**/admin/embeddings**', async route => {
            const path = new URL(route.request().url()).pathname;
            if (route.request().method() === 'GET')
                return route.fulfill({
                    json: path.endsWith('/coverage')
                        ? coverage
                        : {
                              ...status,
                              repairJobs: [
                                  {
                                      _id: jobId,
                                      state: 'paused',
                                      scanned: advances,
                                      repaired: advances,
                                      outcomes: {},
                                      awaitingVerification: false,
                                  },
                              ],
                              batches: batch ? [batch] : [],
                          },
                });
            const body = route.request().postDataJSON();
            if (path.endsWith('/batches')) {
                starts += 1;
                expect(body.kind).toBe('verification');
                expect(body.limit).toBe(2);
                expect(body.paidAuthorized).toBe(false);
                batch = {
                    _id: jobId,
                    jobId,
                    kind: 'verification',
                    limit: 2,
                    processed: 0,
                    sequence: 0,
                    state: 'running',
                };
                if (scenario === 'pending navigation') await hold;
            } else if (path.endsWith('/advance')) {
                expect(body.sequence).toBe(advances);
                advances += 1;
                if (scenario === 'cancel interrupted') await hold;
                if (batch.state === 'running')
                    batch = {
                        ...batch,
                        processed: advances,
                        sequence: advances,
                        state: advances >= 2 ? 'completed' : 'running',
                    };
            } else if (path.endsWith('/cancel')) batch.state = 'cancelled';
            else throw new Error(path);
            await route.fulfill({ json: batch }).catch(() => {});
        });
        await page.goto('/admin');
        await page.getByText('Advanced support tools', { exact: true }).click();
        const section = page.getByRole('region', { name: 'Bounded batches' });
        await section.getByLabel('Existing job').selectOption(jobId);
        await section.getByLabel('Record limit').fill('2');
        await section.getByRole('button', { name: 'Start bounded verification' }).dblclick();
        if (scenario === 'pending navigation') {
            await page.evaluate(() => {
                Object.defineProperty(document, 'hidden', { configurable: true, value: true });
                document.dispatchEvent(new Event('visibilitychange'));
                Object.defineProperty(document, 'hidden', { configurable: true, value: false });
                document.dispatchEvent(new Event('visibilitychange'));
            });
            release();
            await expect(
                section.getByRole('button', { name: 'Start bounded verification' })
            ).toBeEnabled();
            await page.waitForTimeout(1100);
            expect(advances).toBe(0);
        } else if (scenario === 'cancel interrupted') {
            await expect.poll(() => advances).toBe(1);
            await section.getByRole('button', { name: 'Cancel batch' }).click();
            release();
            await expect(section).toContainText('cancelled');
            await page.waitForTimeout(1100);
            expect(advances).toBe(1);
        } else {
            await expect(section).toContainText('completed · 2/2');
            expect(advances).toBe(2);
        }
        expect(starts).toBe(1);
        await page.reload();
        await page.getByText('Advanced support tools', { exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Bounded batches' })).toBeVisible();
        await page.waitForTimeout(1000);
        expect(advances).toBe(
            scenario === 'bounded' ? 2 : scenario === 'pending navigation' ? 0 : 1
        );
    });
}

test('metadata preflight does not imply eligibility and paid batches need separate authorization', async ({
    page,
}) => {
    const jobId = '22222222-2222-4222-8222-222222222222';
    let batch: any = null,
        paidStarts = 0;
    await page.route('**/auth/session', r =>
        r.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', async r => {
        const path = new URL(r.request().url()).pathname;
        if (r.request().method() === 'GET')
            return r.fulfill({
                json: path.endsWith('/coverage')
                    ? coverage
                    : path.endsWith('/preflight')
                      ? {
                            observed: 6,
                            truncated: false,
                            missingVerification: 4,
                            generated: 1,
                            missingOwnerOrUri: 1,
                            paidCeiling: { embeddingUsdUpperEstimate: null },
                        }
                      : {
                            ...status,
                            enabled: true,
                            dualWrite: true,
                            jobs: [
                                {
                                    _id: jobId,
                                    dryRun: false,
                                    state: 'paused',
                                    kind: 'credentials',
                                    scanned: 0,
                                    written: 0,
                                    skipped: 0,
                                    errors: 0,
                                    plan: {
                                        embeddingRequests: 0,
                                        representationCalls: 0,
                                        embeddingUsdUpperEstimate: null,
                                    },
                                },
                            ],
                            batches: batch ? [batch] : [],
                        },
            });
        const body = r.request().postDataJSON();
        if (path.endsWith('/batches')) {
            expect(body.paidAuthorized).toBe(true);
            expect(body.kind).toBe('apply');
            expect(body.limit).toBe(1);
            paidStarts += 1;
            batch = {
                _id: jobId,
                jobId,
                kind: 'apply',
                state: 'running',
                processed: 0,
                sequence: 0,
                limit: 1,
            };
        } else {
            expect(body.sequence).toBe(0);
            batch = { ...batch, state: 'completed', processed: 1, sequence: 1 };
        }
        await r.fulfill({ json: batch });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await panel.getByRole('button', { name: 'Preview aggregate metadata' }).click();
    await expect(panel).toContainText('proof validity not checked');
    await panel.getByLabel('Batch operation').selectOption('apply');
    await panel.getByLabel('Existing job').selectOption(jobId);
    await panel.getByLabel('Record limit').fill('1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await expect(panel.getByRole('button', { name: 'Start bounded paid apply' })).toBeDisabled();
    await panel.getByLabel('Authorize this paid batch').check();
    await panel.getByRole('button', { name: 'Start bounded paid apply' }).click();
    await expect(panel).toContainText('completed · 1/1');
    expect(paidStarts).toBe(1);
});

test('interrupted batch recovery is an explicit CSRF mutation; reading/reopening dispatches nothing', async ({
    page,
}) => {
    const id = '33333333-3333-4333-8333-333333333333';
    let posts = 0,
        recovered = false;
    await page.route('**/auth/session', r =>
        r.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', async r => {
        const path = new URL(r.request().url()).pathname;
        if (r.request().method() === 'GET')
            return r.fulfill({
                json: path.endsWith('/coverage')
                    ? coverage
                    : {
                          ...status,
                          batches: [
                              {
                                  _id: id,
                                  jobId: id,
                                  kind: 'verification',
                                  state: 'interrupted',
                                  processed: 1,
                                  sequence: 0,
                                  limit: 5,
                                  recoverable: !recovered,
                              },
                          ],
                      },
            });
        expect(path).toBe(`/admin/embeddings/batches/${id}/recover`);
        expect(r.request().postDataJSON()).toEqual({});
        expect(r.request().headers()['x-passport-csrf']).toBe('fixture-token');
        posts += 1;
        recovered = true;
        await r.fulfill({ json: {} });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const button = page.getByRole('button', { name: 'Recover interrupted batch' });
    await expect(button).toBeVisible();
    expect(posts).toBe(0);
    await page.reload();
    await page.getByText('Advanced support tools', { exact: true }).click();
    await expect(button).toBeVisible();
    expect(posts).toBe(0);
    await button.click();
    await expect(button).toHaveCount(0);
    expect(posts).toBe(1);
});

test('batch buttons render primary/disabled/focus/loading states and deduplicate metadata preview', async ({
    page,
}) => {
    let reads = 0;
    let release!: () => void;
    const hold = new Promise<void>(r => {
        release = r;
    });
    await page.route('**/auth/session', r =>
        r.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', async r => {
        const path = new URL(r.request().url()).pathname;
        if (path.endsWith('/preflight')) {
            reads += 1;
            await hold;
            return r.fulfill({
                json: { observed: 0, missingVerification: 0, generated: 0, missingOwnerOrUri: 0 },
            });
        }
        if (r.request().method() !== 'GET')
            throw new Error('No mutation authorized in styling fixture');
        return r.fulfill({ json: path.endsWith('/coverage') ? coverage : status });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    const preview = panel.getByRole('button', { name: 'Preview aggregate metadata' });
    const start = panel.getByRole('button', { name: 'Start bounded verification' });
    await expect(start).toBeDisabled();
    expect(
        await preview.evaluate(e => parseFloat(getComputedStyle(e).borderRadius))
    ).toBeGreaterThan(0);
    expect(await preview.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)'
    );
    expect(await start.evaluate(e => Number(getComputedStyle(e).opacity))).toBeLessThan(1);
    await preview.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    expect(await preview.evaluate(e => getComputedStyle(e).boxShadow)).not.toBe('none');
    await preview.dblclick();
    await expect(preview).toHaveAttribute('aria-busy', 'true');
    await expect(preview).toBeDisabled();
    await expect(preview).toHaveText('Previewing metadata…');
    expect(reads).toBe(1);
    release();
    await expect(preview).toBeEnabled();
    await expect(preview).toHaveAttribute('aria-busy', 'false');
    await page.screenshot({ path: '/tmp/pr98-styled-buttons-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await page.screenshot({ path: '/tmp/pr98-styled-buttons-mobile.png', fullPage: true });
});

const publicPricing = {
    embeddingModel: 'amazon.nova-2-multimodal-embeddings-v1:0',
    generationModel: 'us.openai.gpt-6-luna',
    region: 'us-east-1 (generation: US geographic routing)',
    checkedAt: '2026-10-13',
    embeddingRateSource:
        'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonBedrock/current/us-east-1/index.json',
    generationRateSource:
        'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-openai-gpt-6-luna.html#model-card-openai-gpt-6-luna-pricing',
    privacyRateSource: 'https://aws.amazon.com/bedrock/pricing/',
    embeddingUsdPerMillionTokens: 0.135,
    generationInputUsdPerMillionTokens: 0.11,
    generationOutputUsdPerMillionTokens: 0.55,
    privacyUsdPerThousandTextUnits: 0.1,
};
const pricedJob = {
    _id: '44444444-4444-4444-8444-444444444444',
    dryRun: false,
    state: 'paused',
    kind: 'credentials',
    scanned: 2,
    written: 2,
    skipped: 0,
    errors: 0,
    plan: {
        embeddingRequests: 10,
        representationCalls: 2,
        embeddingUsdUpperEstimate: 0.0110592,
        pricing: publicPricing,
        estimate: {
            embeddingRequests: 10,
            representationCalls: 2,
            privacyRequests: 6,
            generationInputTokensPerCall: 20000,
            generationOutputTokensPerCall: 4096,
            embeddingTokensPerRequest: 8192,
            privacyTextUnitsPerRequest: 100,
            embeddingUsd: 0.0110592,
            generationUsd: 0.0089056,
            privacyUsd: 0.06,
            totalUsd: 0.0799648,
            knownSubtotalUsd: 0.0799648,
            missingComponents: [],
        },
    },
};
const pricedStatus = {
    ...status,
    enabled: true,
    dualWrite: true,
    pricing: publicPricing,
    jobs: [pricedJob],
};

test('paid estimate recalculates batch size and optional input allowance without provider requests', async ({
    page,
}) => {
    let mutations = 0;
    await page.route('**/auth/session', route =>
        route.fulfill({
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings**', route => {
        if (route.request().method() !== 'GET') mutations += 1;
        return route.fulfill({
            json: route.request().url().endsWith('/coverage') ? coverage : pricedStatus,
        });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await expect(panel.getByRole('region', { name: 'Selected paid batch pricing' })).toHaveCount(0);
    await panel.getByLabel('Batch operation').selectOption('apply');
    const estimate = panel.getByRole('region', {
        name: 'Selected paid batch pricing',
    });
    await expect(estimate).toContainText(
        'Expected cost unknown. Measured token/text usage is not available.'
    );
    await expect(estimate.locator('dl')).not.toBeVisible();
    await expect(estimate.getByText(/Embedding: \$0.1350 per million tokens/)).toBeVisible();
    await estimate
        .getByText('Conservative stress scenario (not a forecast or spending cap)')
        .click();
    await expect(estimate).toContainText('5 records');
    await expect(estimate.locator('dl')).toContainText('Embedding$0.0276');
    await expect(estimate.locator('dl')).toContainText('Representation generation$0.0223');
    await expect(estimate.locator('dl')).toContainText('Privacy inspection$0.1500');
    await expect(estimate.locator('dl')).toContainText('Scenario total (USD)$0.1999');
    await panel.getByLabel('Record limit').fill('2');
    await expect(estimate.locator('dl')).toContainText('Scenario total (USD)$0.0800');
    const allowance = panel.getByLabel('Generation input tokens per record');
    await allowance.fill('10000');
    await expect(estimate.locator('dl')).toContainText('Scenario total (USD)$0.0778');
    await allowance.fill('');
    await expect(estimate.locator('dl')).toContainText('Scenario total (USD)$0.0800');
    await allowance.fill('272001');
    await expect(allowance).toHaveAttribute('aria-invalid', 'true');
    await expect(estimate.locator('dl')).toHaveCount(0);
    await expect(panel).toContainText('Longer-context pricing is not covered');
    await allowance.fill('20000');
    await expect(estimate).toContainText('10 embedding requests × 8,192 tokens/request allowance');
    await expect(estimate).toContainText('enforced 4,096 output-token cap/call');
    await expect(estimate).toContainText('6 privacy requests × 100 text units/request');
    await expect(estimate).toContainText('checked 2026-10-13');
    await expect(estimate.getByRole('link', { name: 'AWS generation pricing' })).toHaveAttribute(
        'href',
        publicPricing.generationRateSource
    );
    await expect(estimate.getByRole('link', { name: 'AWS embedding pricing' })).toHaveAttribute(
        'href',
        publicPricing.embeddingRateSource
    );
    await expect(estimate.getByRole('link', { name: 'AWS Guardrails pricing' })).toHaveAttribute(
        'href',
        publicPricing.privacyRateSource
    );
    await expect(estimate).toContainText('not a measured bill or a hard dollar cap');
    await expect(estimate).toContainText('retries can incur charges again');
    await page.screenshot({
        path: '/tmp/ai-passport-pricing-desktop.png',
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await page.screenshot({
        path: '/tmp/ai-passport-pricing-mobile.png',
        fullPage: true,
    });
    await panel.getByLabel('Batch operation').selectOption('verification');
    await expect(estimate).toHaveCount(0);
    await expect(allowance).toHaveCount(0);
    expect(mutations).toBe(0);
});

test('unknown pricing shows incomplete subtotal and old API responses remain usable', async ({
    page,
}) => {
    let current: any = {
        ...pricedStatus,
        pricing: {
            ...publicPricing,
            generationModel: null,
            generationRateSource: null,
            generationInputUsdPerMillionTokens: null,
            generationOutputUsdPerMillionTokens: null,
        },
    };
    await page.route('**/auth/session', route =>
        route.fulfill({
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings**', route =>
        route.fulfill({
            json: route.request().url().endsWith('/coverage') ? coverage : current,
        })
    );
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await panel.getByLabel('Batch operation').selectOption('apply');
    const estimate = panel.getByRole('region', {
        name: 'Selected paid batch pricing',
    });
    await expect(estimate.locator('dl')).not.toBeVisible();
    await estimate
        .getByText('Conservative stress scenario (not a forecast or spending cap)')
        .click();
    await expect(estimate.locator('dl')).toContainText('Representation generationUnknown');
    await expect(estimate.locator('dl')).toContainText('Known subtotal (incomplete)$0.1776');
    await expect(estimate).toContainText('a full total is unavailable');
    await expect(estimate.getByText('Scenario total (USD)', { exact: true })).toHaveCount(0);
    current = {
        ...pricedStatus,
        pricing: undefined,
        jobs: [
            {
                ...pricedJob,
                plan: {
                    embeddingRequests: 10,
                    representationCalls: 2,
                    embeddingUsdUpperEstimate: null,
                },
            },
        ],
    };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(estimate.getByText('Unknown', { exact: true })).toHaveCount(3);
    await expect(estimate.locator('dl')).toContainText('Known subtotal (incomplete)$0.0000');
    await expect(estimate.getByText('Scenario total (USD)', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Cumulative job cost planning' })).toContainText(
        'a full total is unavailable'
    );
    await expect(panel.getByRole('button', { name: 'Start bounded paid apply' })).toBeDisabled();
});

test('cumulative cost uses the job plan and rate snapshot independently of selected batch planning', async ({
    page,
}) => {
    await page.route('**/auth/session', route =>
        route.fulfill({
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings**', route =>
        route.fulfill({
            json: route.request().url().endsWith('/coverage')
                ? coverage
                : {
                      ...pricedStatus,
                      pricing: {
                          ...publicPricing,
                          generationInputUsdPerMillionTokens: null,
                      },
                  },
        })
    );
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const cumulative = page.getByRole('region', {
        name: 'Cumulative job cost planning',
    });
    await expect(cumulative.locator('dl')).not.toBeVisible();
    await cumulative
        .getByText('Conservative stress scenario (not a forecast or spending cap)')
        .click();
    await expect(cumulative.locator('dl')).toContainText('Scenario total (USD)$0.0800');
    await expect(cumulative).toContainText('including earlier batches');
    await expect(cumulative).toContainText('2 representation calls × 20,000 input tokens/call');
    await expect(cumulative.getByRole('link', { name: 'AWS generation pricing' })).toHaveAttribute(
        'href',
        publicPricing.generationRateSource
    );
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await panel.getByLabel('Batch operation').selectOption('apply');
    await panel.getByLabel('Record limit').fill('10');
    await panel.getByText('Conservative stress scenario (not a forecast or spending cap)').click();
    await panel.getByLabel('Generation input tokens per record').fill('10000');
    await expect(panel.getByRole('region', { name: 'Selected paid batch pricing' })).toContainText(
        'Known subtotal (incomplete)'
    );
    await expect(cumulative.locator('dl')).toContainText('Scenario total (USD)$0.0800');
    await expect(cumulative).toContainText('2 representation calls × 20,000 input tokens/call');
});

test('planning estimate does not authorize paid work or change the batch API payload', async ({
    page,
}) => {
    let current = { ...pricedStatus, fresh: false };
    const requests: any[] = [];
    await page.route('**/auth/session', route =>
        route.fulfill({
            json: { authenticated: true, did: 'did:web:fixture-profile' },
        })
    );
    await page.route('**/admin/embeddings**', route => {
        if (route.request().method() === 'GET')
            return route.fulfill({
                json: route.request().url().endsWith('/coverage') ? coverage : current,
            });
        expect(new URL(route.request().url()).pathname).toBe('/admin/embeddings/batches');
        const body = route.request().postDataJSON();
        requests.push(body);
        return route.fulfill({
            json: {
                _id: 'estimate-batch',
                jobId: pricedJob._id,
                kind: 'apply',
                state: 'completed',
                limit: 1,
                processed: 1,
                sequence: 1,
            },
        });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await panel.getByLabel('Batch operation').selectOption('apply');
    await panel.getByLabel('Existing job').selectOption(pricedJob._id);
    await panel.getByLabel('Record limit').fill('1');
    await panel.getByText('Conservative stress scenario (not a forecast or spending cap)').click();
    await panel.getByLabel('Generation input tokens per record').fill('10000');
    const start = panel.getByRole('button', { name: 'Start bounded paid apply' });
    await panel.getByLabel('Authorize this paid batch').check();
    await expect(start).toBeDisabled();
    current = { ...current, fresh: true, enabled: false };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(start).toBeDisabled();
    current = { ...current, enabled: true };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(start).toBeEnabled();
    await panel.getByLabel('Authorize this paid batch').uncheck();
    await expect(start).toBeDisabled();
    expect(requests).toHaveLength(0);
    await panel.getByLabel('Authorize this paid batch').check();
    await start.click();
    await expect(panel).toContainText('Bounded batches');
    await expect.poll(() => requests.length).toBe(1);
    expect(requests[0]).toEqual({
        requestId: expect.any(String),
        kind: 'apply',
        jobId: pricedJob._id,
        limit: 1,
        paidAuthorized: true,
    });
});

test('recorded successful samples power planning only for the selected job and stay separate from billing', async ({
    page,
}) => {
    const observedUsage = {
        attempts: 3,
        failedAttempts: 1,
        historicalRequestsUnmeasured: true,
        knownListPriceUsd: 0.0012,
        unpricedComponents: [],
        totals: {
            generation: { requests: 3, measuredRequests: 2, inputTokens: 2000, outputTokens: 800 },
            embedding: { requests: 10, measuredRequests: 0, inputTokens: 0 },
            privacy: { requests: 7, measuredRequests: 6, textUnits: 6, freeTextUnits: 0 },
        },
        unmeasuredRequests: { generation: 1, embedding: 10, privacy: 1 },
        sample: {
            count: 2,
            meanKnownUsd: 0.0006,
            meanWithEmbeddingAllowanceUsd: 0.0061296,
            minKnownUsd: 0.0004,
            maxWithEmbeddingAllowanceUsd: 0.007,
        },
        pricesMatch: true,
    };
    let current = {
        ...pricedStatus,
        jobs: [{ ...pricedJob, plan: { ...pricedJob.plan, observedUsage } }],
    };
    await page.route('**/auth/session', route =>
        route.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', route => {
        expect(route.request().method()).toBe('GET');
        return route.fulfill({
            json: route.request().url().endsWith('/coverage') ? coverage : current,
        });
    });
    await page.goto('/admin');
    await page.getByText('Advanced support tools', { exact: true }).click();
    const panel = page.getByRole('region', { name: 'Bounded batches' });
    await panel.getByLabel('Batch operation').selectOption('apply');
    await expect(panel).toContainText('Expected cost unknown');
    await panel.getByLabel('Existing job').selectOption(pricedJob._id);
    await expect(panel).toContainText('Sample-based planning range for 5 records: $0.0030–$0.0306');
    await expect(panel).toContainText('Based on 2 successful credential attempts');
    await expect(panel).toContainText('Measured generation/privacy + embedding allowance');
    await expect(panel).toContainText('Earlier job attempts have no measured usage');
    await panel.getByLabel('Record limit').fill('2');
    await expect(panel).toContainText('Sample-based planning range for 2 records: $0.0012–$0.0123');
    await expect(panel.getByRole('button', { name: 'Start bounded paid apply' })).toBeDisabled();
    current = {
        ...current,
        jobs: [
            {
                ...pricedJob,
                plan: {
                    ...pricedJob.plan,
                    observedUsage: { ...observedUsage, pricesMatch: false },
                },
            },
        ],
    };
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    await expect(panel).toContainText('Pricing configuration changed');
    await expect(panel.getByText(/Sample-based planning range/)).toHaveCount(0);
    await expect(panel).toContainText('Expected cost unknown');
});

test('primary screen is coverage and one whole-workflow button; legacy controls are collapsed', async ({
    page,
}) => {
    await page.route('**/auth/session', route =>
        route.fulfill({ headers, json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    let mutations = 0;
    await page.route('**/admin/embeddings**', route => {
        if (route.request().method() !== 'GET') mutations += 1;
        return route.fulfill({
            headers,
            json: route.request().url().endsWith('/coverage')
                ? coverage
                : { ...status, enabled: true, dualWrite: true },
        });
    });
    await page.goto('/admin');
    await expect(
        page.getByRole('button', { name: 'Backfill everything', exact: true })
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Credentials prepared for cutover' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create verify-only range' })).not.toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Start bounded verification' })
    ).not.toBeVisible();
    expect(mutations).toBe(0);
});

test('exhausted record recovery is explicit, bounded and inert after interrupted confirmation', async ({
    page,
}) => {
    let posts = 0;
    const current = {
        _id: '11111111-1111-4111-8111-111111111111',
        workflowVersion: 2,
        state: 'paused',
        processed: 4295,
        recordLimit: 5000,
        written: 4295,
        skipped: 0,
        generationRequests: 4300,
        embeddingRequests: 21500,
        privacyRequests: 12900,
        maxGenerationRequests: 5000,
        maxEmbeddingRequests: 25000,
        maxPrivacyRequests: 15000,
        draining: false,
        resumable: false,
        updatedAt: new Date().toISOString(),
        resumeBlock: {
            code: 'embedding_attempts_exhausted',
            record: 4296,
            message: 'Resume cannot add attempts. Review the exhausted record.',
        },
        recovery: undefined as
            | undefined
            | {
                  id: string;
                  record: number;
                  phase: string;
                  used: { generation: number; embedding: number; privacy: number };
                  caps: { generation: number; embedding: number; privacy: number };
                  expiresAt: string;
              },
    };
    await page.route('**/auth/session', route =>
        route.fulfill({ json: { authenticated: true, did: 'did:web:fixture-profile' } })
    );
    await page.route('**/admin/embeddings**', async route => {
        if (route.request().method() === 'GET')
            return route.fulfill({
                json: route.request().url().endsWith('/coverage')
                    ? coverage
                    : { ...status, enabled: true, dualWrite: true, runs: [current] },
            });
        posts += 1;
        expect(route.request().url()).toMatch(/\/recover-once$/);
        const body = route.request().postDataJSON();
        expect(body).toEqual({
            requestId: expect.any(String),
            record: 4296,
            paidAuthorized: true,
            caps: { generation: 1, embedding: 5, privacy: 3 },
        });
        current.state = 'interrupted';
        current.resumeBlock = {
            code: 'single_recovery_consumed',
            record: 4296,
            message: 'This single-use recovery pass has already been claimed.',
        };
        current.recovery = {
            id: body.requestId,
            record: 4296,
            phase: 'interrupted',
            used: { generation: 1, embedding: 2, privacy: 3 },
            caps: body.caps,
            expiresAt: new Date().toISOString(),
        };
        await route.abort('failed');
    });
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Review single-use recovery', exact: true }).click();
    await expect(
        page.getByRole('button', { name: 'Confirm one paid recovery pass' })
    ).toBeVisible();
    expect(posts).toBe(0);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Confirm one paid recovery pass' })).toHaveCount(
        0
    );
    await page.getByRole('button', { name: 'Review single-use recovery', exact: true }).click();
    await page.screenshot({ path: 'test-results/recovery-review-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/recovery-review-mobile.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
    );
    await page.getByRole('button', { name: 'Confirm one paid recovery pass' }).dblclick();
    await expect.poll(() => posts).toBe(1);
    await page.reload();
    await expect(
        page.getByText('Single-use recovery for record 4296:', { exact: false })
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Review single-use recovery', exact: true })
    ).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Resume with remaining budget' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancel backfill' })).toBeEnabled();
    expect(posts).toBe(1);
});
