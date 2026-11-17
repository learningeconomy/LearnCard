import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IntegrationWebhookStatus, LCNIntegration } from '@learncard/types';
import { WebhooksTab } from './WebhooksTab';
import * as m from '../../../../paraglide/messages.js';
import { setLocale } from '../../../../paraglide/runtime.js';

const state = vi.hoisted(() => ({
    updateIntegration: vi.fn(),
    setIntegrationWebhook: vi.fn(),
    getIntegrationWebhook: vi.fn(),
    rotateIntegrationWebhookSecret: vi.fn(),
    sendIntegrationTestEvent: vi.fn(),
    presentToast: vi.fn(),
    clipboardWrite: vi.fn(),
    locale: 'en',
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({
        initWallet: async () => ({
            invoke: {
                updateIntegration: state.updateIntegration,
                setIntegrationWebhook: state.setIntegrationWebhook,
                getIntegrationWebhook: state.getIntegrationWebhook,
                rotateIntegrationWebhookSecret: state.rotateIntegrationWebhookSecret,
                sendIntegrationTestEvent: state.sendIntegrationTestEvent,
            },
        }),
    }),
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));
vi.mock('learn-card-base/hooks/useToast', () => ({
    useToast: () => ({ presentToast: state.presentToast }),
    ToastTypeEnum: { Error: 'error', Success: 'success' },
}));
vi.mock('@capacitor/clipboard', () => ({ Clipboard: { write: state.clipboardWrite } }));
vi.mock('../../../../i18n', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../../i18n')>()),
    useLocale: () => state.locale,
}));
vi.mock('../../utils/appDid', () => ({ getAppDidFromSlug: () => 'did:example:app' }));

const SECRET = 'whsec_test-secret-value';
const WEBHOOK_URL = 'https://partner.example/learncard/webhook';
const t = (key: keyof typeof webhookKeys, params?: Record<string, unknown>): string =>
    (m[webhookKeys[key]] as (input?: Record<string, unknown>) => string)(params);
const webhookKeys = {
    saveUrl: 'developerPortal.dashboards.tabs.webhooks.saveUrl',
    removeUrl: 'developerPortal.dashboards.tabs.webhooks.removeUrl',
    urlTitle: 'developerPortal.dashboards.tabs.webhooks.urlTitle',
    urlInvalid: 'developerPortal.dashboards.tabs.webhooks.urlInvalid',
    feedToggle: 'developerPortal.dashboards.tabs.webhooks.feedToggle',
    statusDisabled: 'developerPortal.dashboards.tabs.webhooks.statusDisabled',
    secretNone: 'developerPortal.dashboards.tabs.webhooks.secretNone',
    secretExists: 'developerPortal.dashboards.tabs.webhooks.secretExists',
    rotateSecret: 'developerPortal.dashboards.tabs.webhooks.rotateSecret',
    dismissSecret: 'developerPortal.dashboards.tabs.webhooks.dismissSecret',
    secretOnceWarning: 'developerPortal.dashboards.tabs.webhooks.secretOnceWarning',
    previousSecretExpires: 'developerPortal.dashboards.tabs.webhooks.previousSecretExpires',
    copySecret: 'developerPortal.dashboards.tabs.webhooks.copySecret',
    sendTest: 'developerPortal.dashboards.tabs.webhooks.sendTest',
    testNeedsUrl: 'developerPortal.dashboards.tabs.webhooks.testNeedsUrl',
    testDelivered: 'developerPortal.dashboards.tabs.webhooks.testDelivered',
    testFailedStatus: 'developerPortal.dashboards.tabs.webhooks.testFailedStatus',
    testFailedTimeout: 'developerPortal.dashboards.tabs.webhooks.testFailedTimeout',
    testRequestFailed: 'developerPortal.dashboards.tabs.webhooks.testRequestFailed',
    testRateLimited: 'developerPortal.dashboards.tabs.webhooks.testRateLimited',
    healthTitle: 'developerPortal.dashboards.tabs.webhooks.healthTitle',
    healthRefresh: 'developerPortal.dashboards.tabs.webhooks.healthRefresh',
    healthLoadFailed: 'developerPortal.dashboards.tabs.webhooks.healthLoadFailed',
    healthStateActive: 'developerPortal.dashboards.tabs.webhooks.healthStateActive',
    healthStateFailing: 'developerPortal.dashboards.tabs.webhooks.healthStateFailing',
    healthStateDisabled: 'developerPortal.dashboards.tabs.webhooks.healthStateDisabled',
    healthNever: 'developerPortal.dashboards.tabs.webhooks.healthNever',
    healthNoSecret: 'developerPortal.dashboards.tabs.webhooks.healthNoSecret',
    reasonHttp: 'developerPortal.dashboards.tabs.webhooks.reasonHttp',
    feedDescription: 'developerPortal.dashboards.tabs.webhooks.feedDescription',
    rotateFailed: 'developerPortal.dashboards.tabs.webhooks.rotateFailed',
    title: 'developerPortal.dashboards.tabs.webhooks.title',
} as const;

const integration: LCNIntegration = {
    id: 'webhook-project',
    name: 'Webhook project',
    publishableKey: 'test-publishable-key',
    whitelistedDomains: [],
    status: 'setup',
};
const configured: LCNIntegration = {
    ...integration,
    webhookUrl: WEBHOOK_URL,
    hasWebhookSecret: true,
    contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
};

const noWebhookStatus: IntegrationWebhookStatus = {
    webhookUrl: null,
    state: 'disabled',
    hasSecret: false,
    secretVersion: 0,
    pendingDeliveries: 0,
    retryingDeliveries: 0,
};
const activeStatus: IntegrationWebhookStatus = {
    webhookUrl: WEBHOOK_URL,
    state: 'active',
    contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
    hasSecret: true,
    secretVersion: 1,
    pendingDeliveries: 0,
    retryingDeliveries: 0,
};

const showTab = (
    project: LCNIntegration = integration,
    client: QueryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
): void => {
    render(
        <QueryClientProvider client={client}>
            <WebhooksTab integration={project} />
        </QueryClientProvider>
    );
};

beforeEach(() => {
    state.locale = 'en';
    setLocale('en', { reload: false });
    state.updateIntegration.mockReset().mockResolvedValue(true);
    state.setIntegrationWebhook.mockReset().mockResolvedValue({ webhookUrl: WEBHOOK_URL });
    state.getIntegrationWebhook.mockReset().mockResolvedValue(activeStatus);
    state.rotateIntegrationWebhookSecret.mockReset().mockResolvedValue({ secret: SECRET });
    state.sendIntegrationTestEvent.mockReset().mockResolvedValue({
        delivered: true,
        httpStatus: 204,
        latencyMs: 87,
    });
    state.presentToast.mockReset();
    state.clipboardWrite.mockReset().mockResolvedValue(undefined);
});
afterEach(() => {
    cleanup();
});

describe('Webhooks tab', () => {
    it('saves a valid webhook URL and rejects an invalid one', async () => {
        showTab();
        const input = screen.getByRole('textbox', { name: t('urlTitle') });
        const save = screen.getByRole('button', { name: t('saveUrl') });
        expect(save).toBeDisabled();
        expect(screen.queryByRole('button', { name: t('removeUrl') })).toBeNull();

        fireEvent.change(input, { target: { value: 'ftp://partner.example/hook' } });
        expect(screen.getByText(t('urlInvalid'))).toBeInTheDocument();
        expect(save).toBeDisabled();

        fireEvent.change(input, { target: { value: `  ${WEBHOOK_URL}  ` } });
        expect(screen.queryByText(t('urlInvalid'))).toBeNull();
        fireEvent.click(save);

        await waitFor(() =>
            expect(state.setIntegrationWebhook).toHaveBeenCalledWith(integration.id, WEBHOOK_URL)
        );
        expect(state.updateIntegration).not.toHaveBeenCalled();
        // Replacing a URL returns no secret, so none is shown.
        expect(screen.queryByTestId('webhook-secret')).toBeNull();
    });

    it('removes the saved webhook URL with null', async () => {
        showTab(configured);
        expect(screen.getByRole('textbox', { name: t('urlTitle') })).toHaveValue(WEBHOOK_URL);
        expect(screen.getByRole('button', { name: t('saveUrl') })).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: t('removeUrl') }));

        await waitFor(() =>
            expect(state.setIntegrationWebhook).toHaveBeenCalledWith(configured.id, null)
        );
        expect(state.updateIntegration).not.toHaveBeenCalled();
    });

    it('enables the event feed without a webhook, and disables it again', async () => {
        showTab();
        expect(screen.getByText(t('statusDisabled'))).toBeInTheDocument();
        const toggle = screen.getByRole('switch', { name: t('feedToggle') });
        expect(toggle).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(toggle);
        await waitFor(() =>
            expect(state.updateIntegration).toHaveBeenCalledWith(integration.id, {
                contractEventsEnabled: true,
            })
        );
        cleanup();

        showTab(configured);
        const enabledToggle = screen.getByRole('switch', { name: t('feedToggle') });
        expect(enabledToggle).toHaveAttribute('aria-checked', 'true');
        fireEvent.click(enabledToggle);
        await waitFor(() =>
            expect(state.updateIntegration).toHaveBeenLastCalledWith(configured.id, {
                contractEventsEnabled: false,
            })
        );
    });

    it('shows the first secret once when saving the URL creates it', async () => {
        state.setIntegrationWebhook.mockResolvedValue({
            webhookUrl: WEBHOOK_URL,
            secret: SECRET,
            contractEventsEnabledAt: '2026-11-14T00:00:00.000Z',
        });
        showTab();
        expect(screen.getByText(t('secretNone'))).toBeInTheDocument();
        expect(screen.queryByTestId('webhook-secret')).toBeNull();
        // Without a secret there is nothing to rotate: the first one comes from saving a URL.
        expect(screen.queryByRole('button', { name: t('rotateSecret') })).toBeNull();

        fireEvent.change(screen.getByRole('textbox', { name: t('urlTitle') }), {
            target: { value: WEBHOOK_URL },
        });
        fireEvent.click(screen.getByRole('button', { name: t('saveUrl') }));

        expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);
        expect(state.rotateIntegrationWebhookSecret).not.toHaveBeenCalled();
        expect(screen.getByText(t('secretOnceWarning'))).toBeInTheDocument();
        expect(screen.queryByText(/previous secret/i)).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: t('copySecret') }));
        await waitFor(() => expect(state.clipboardWrite).toHaveBeenCalledWith({ string: SECRET }));
        for (const call of state.presentToast.mock.calls)
            expect(JSON.stringify(call)).not.toContain(SECRET);
    });

    it('shows when the previous secret stops working after a rotation', async () => {
        const previousSecretExpiresAt = '2026-11-18T12:00:00.000Z';
        state.rotateIntegrationWebhookSecret.mockResolvedValue({
            secret: SECRET,
            previousSecretExpiresAt,
        });
        showTab(configured);
        expect(screen.getByText(t('secretExists'))).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));

        expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);
        expect(
            screen.getByText(
                t('previousSecretExpires', {
                    date: new Date(previousSecretExpiresAt).toLocaleString('en'),
                })
            )
        ).toBeInTheDocument();
    });

    describe('a secret that outlives the tab', () => {
        const newClient = (): QueryClient =>
            new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

        it('keeps a rotated secret that arrives after the tab unmounted, until dismissed', async () => {
            let resolveRotation: (value: { secret: string }) => void = () => undefined;
            state.rotateIntegrationWebhookSecret.mockReturnValue(
                new Promise(resolve => {
                    resolveRotation = resolve;
                })
            );
            const client = newClient();
            showTab(configured, client);
            fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));
            await waitFor(() => expect(state.rotateIntegrationWebhookSecret).toHaveBeenCalled());

            // The developer switches dashboard tabs before the request finishes.
            cleanup();
            resolveRotation({ secret: SECRET });
            await new Promise(resolve => setTimeout(resolve, 20));

            showTab(configured, client);
            expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);
            expect(screen.getByText(t('secretOnceWarning'))).toBeInTheDocument();

            // Leaving and returning again still shows it, until it is dismissed.
            cleanup();
            showTab(configured, client);
            expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);

            fireEvent.click(screen.getByRole('button', { name: t('dismissSecret') }));
            await waitFor(() => expect(screen.queryByTestId('webhook-secret')).toBeNull());
            expect(screen.getByText(t('secretExists'))).toBeInTheDocument();

            cleanup();
            showTab(configured, client);
            await waitFor(() => expect(state.getIntegrationWebhook).toHaveBeenCalled());
            expect(screen.queryByTestId('webhook-secret')).toBeNull();
        });

        it('keeps the first secret when the registration finishes after the tab unmounted', async () => {
            let resolveSave: (value: { webhookUrl: string; secret: string }) => void = () =>
                undefined;
            state.setIntegrationWebhook.mockReturnValue(
                new Promise(resolve => {
                    resolveSave = resolve;
                })
            );
            const client = newClient();
            showTab(integration, client);
            fireEvent.change(screen.getByRole('textbox', { name: t('urlTitle') }), {
                target: { value: WEBHOOK_URL },
            });
            fireEvent.click(screen.getByRole('button', { name: t('saveUrl') }));
            await waitFor(() => expect(state.setIntegrationWebhook).toHaveBeenCalled());

            cleanup();
            resolveSave({ webhookUrl: WEBHOOK_URL, secret: SECRET });
            await new Promise(resolve => setTimeout(resolve, 20));

            showTab({ ...integration, webhookUrl: WEBHOOK_URL, hasWebhookSecret: true }, client);
            expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);
            expect(screen.getByText(t('secretOnceWarning'))).toBeInTheDocument();
        });

        it('replaces a waiting secret with the next rotation and shows only its own integration', async () => {
            const client = newClient();
            showTab(configured, client);
            fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));
            expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);

            state.rotateIntegrationWebhookSecret.mockResolvedValue({ secret: 'whsec_newer' });
            fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));
            await waitFor(() =>
                expect(screen.getByTestId('webhook-secret')).toHaveTextContent('whsec_newer')
            );

            cleanup();
            showTab({ ...configured, id: 'another-project' }, client);
            expect(screen.queryByTestId('webhook-secret')).toBeNull();
        });

        it('never writes the secret to web storage or logs it', async () => {
            const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
            const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
            showTab(configured);
            fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));
            expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);

            const stored = (storage: Storage): string =>
                Array.from({ length: storage.length }, (_, i) => {
                    const key = storage.key(i) ?? '';
                    return `${key}=${storage.getItem(key)}`;
                }).join('\n');
            expect(stored(localStorage)).not.toContain(SECRET);
            expect(stored(sessionStorage)).not.toContain(SECRET);
            expect(JSON.stringify([...log.mock.calls, ...info.mock.calls])).not.toContain(SECRET);
            log.mockRestore();
            info.mockRestore();
        });
    });

    it('reports a failed rotation without showing a secret', async () => {
        state.rotateIntegrationWebhookSecret.mockRejectedValue(new Error('nope'));
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('rotateSecret') }));
        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                t('rotateFailed'),
                expect.objectContaining({ type: 'error' })
            )
        );
        expect(screen.queryByTestId('webhook-secret')).toBeNull();
    });

    it('needs a saved webhook URL before a test event can be sent', () => {
        showTab();
        expect(screen.getByRole('button', { name: t('sendTest') })).toBeDisabled();
        expect(screen.getByText(t('testNeedsUrl'))).toBeInTheDocument();
    });

    it('shows a delivered test event with its HTTP status', async () => {
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        expect(
            await screen.findByText(t('testDelivered', { status: 204, latency: 87 }))
        ).toBeInTheDocument();
        expect(state.sendIntegrationTestEvent).toHaveBeenCalledWith(configured.id);
    });

    it('shows the HTTP status of a rejected test event', async () => {
        state.sendIntegrationTestEvent.mockResolvedValue({
            delivered: false,
            httpStatus: 401,
            latencyMs: 120,
            error: 'http_401',
        });
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        expect(
            await screen.findByText(t('testFailedStatus', { status: 401, latency: 120 }))
        ).toBeInTheDocument();
    });

    it('explains a test event that got no answer and shows its error code', async () => {
        state.sendIntegrationTestEvent.mockResolvedValue({
            delivered: false,
            latencyMs: 6000,
            error: 'timeout',
        });
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        const result = await screen.findByText(t('testFailedTimeout'), { exact: false });
        expect(within(result).getByText('timeout')).toBeInTheDocument();
    });

    it('reports a test request that failed to reach LearnCard', async () => {
        state.sendIntegrationTestEvent.mockRejectedValue(new Error('offline'));
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                t('testRequestFailed'),
                expect.objectContaining({ type: 'error' })
            )
        );
    });

    it('tells the developer when the test event limit is reached', async () => {
        state.sendIntegrationTestEvent.mockRejectedValue(
            Object.assign(new Error('Rate limit exceeded'), { data: { code: 'TOO_MANY_REQUESTS' } })
        );
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                t('testRateLimited'),
                expect.objectContaining({ type: 'error' })
            )
        );
    });

    it('shows delivery health: state, last success and failure with its reason, counts, secret version', async () => {
        const lastSuccessAt = '2026-11-16T09:00:00.000Z';
        const lastFailureAt = '2026-11-17T10:30:00.000Z';
        state.getIntegrationWebhook.mockResolvedValue({
            ...activeStatus,
            state: 'failing',
            secretVersion: 3,
            lastSuccessAt,
            lastFailureAt,
            lastFailureReason: 'http_401',
            pendingDeliveries: 2,
            retryingDeliveries: 5,
        });
        showTab(configured);

        expect(await screen.findByTestId('webhook-state')).toHaveTextContent(
            t('healthStateFailing')
        );
        expect(state.getIntegrationWebhook).toHaveBeenCalledWith(configured.id);
        expect(screen.getByTestId('webhook-last-success')).toHaveTextContent(
            new Date(lastSuccessAt).toLocaleString('en')
        );

        const failure = screen.getByTestId('webhook-last-failure');

        expect(failure).toHaveTextContent(new Date(lastFailureAt).toLocaleString('en'));
        expect(failure).toHaveTextContent(t('reasonHttp', { status: '401' }));
        expect(within(failure).getByText('http_401')).toBeInTheDocument();
        expect(screen.getByTestId('webhook-pending')).toHaveTextContent('2');
        expect(screen.getByTestId('webhook-retrying')).toHaveTextContent('5');
        expect(screen.getByTestId('webhook-secret-version')).toHaveTextContent('3');
    });

    it('shows a disabled webhook with no attempts and no secret', async () => {
        state.getIntegrationWebhook.mockResolvedValue(noWebhookStatus);
        showTab();

        expect(await screen.findByTestId('webhook-state')).toHaveTextContent(
            t('healthStateDisabled')
        );
        expect(screen.getByTestId('webhook-last-success')).toHaveTextContent(t('healthNever'));
        expect(screen.getByTestId('webhook-last-failure')).toHaveTextContent(t('healthNever'));
        expect(screen.getByTestId('webhook-secret-version')).toHaveTextContent(t('healthNoSecret'));
    });

    it('reads health again after a test event and on refresh', async () => {
        showTab(configured);
        expect(await screen.findByTestId('webhook-state')).toHaveTextContent(
            t('healthStateActive')
        );
        expect(state.getIntegrationWebhook).toHaveBeenCalledTimes(1);

        state.getIntegrationWebhook.mockResolvedValue({
            ...activeStatus,
            state: 'failing',
            lastFailureAt: '2026-11-17T10:30:00.000Z',
            lastFailureReason: 'timeout',
        });
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));

        await waitFor(() =>
            expect(screen.getByTestId('webhook-state')).toHaveTextContent(t('healthStateFailing'))
        );

        state.getIntegrationWebhook.mockResolvedValue(activeStatus);
        fireEvent.click(screen.getByRole('button', { name: t('healthRefresh') }));

        await waitFor(() =>
            expect(screen.getByTestId('webhook-state')).toHaveTextContent(t('healthStateActive'))
        );
    });

    it('says so when health cannot be loaded', async () => {
        state.getIntegrationWebhook.mockRejectedValue(new Error('offline'));
        showTab(configured);

        expect(await screen.findByText(t('healthLoadFailed'))).toBeInTheDocument();
        expect(screen.queryByTestId('webhook-state')).toBeNull();
    });

    it('explains that disabling stops deliveries and keeps waiting events in the feed', () => {
        showTab(configured);
        expect(screen.getByText(t('feedDescription'))).toHaveTextContent(
            /stops webhook deliveries right away.*stay in the event feed/
        );
    });

    it.each(['es', 'fr', 'ar'] as const)('renders translated copy in %s', locale => {
        const english = t('title');
        state.locale = locale;
        setLocale(locale, { reload: false });
        showTab();
        const translated = t('title');
        expect(translated).not.toBe(english);
        expect(screen.getByRole('heading', { name: translated })).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: t('feedToggle') })).toBeInTheDocument();
    });
});
