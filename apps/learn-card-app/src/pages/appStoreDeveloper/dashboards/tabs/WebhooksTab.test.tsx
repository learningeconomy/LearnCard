import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCNIntegration } from '@learncard/types';
import { WebhooksTab } from './WebhooksTab';
import * as m from '../../../../paraglide/messages.js';
import { setLocale } from '../../../../paraglide/runtime.js';

const state = vi.hoisted(() => ({
    updateIntegration: vi.fn(),
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
    createSecret: 'developerPortal.dashboards.tabs.webhooks.createSecret',
    rotateSecret: 'developerPortal.dashboards.tabs.webhooks.rotateSecret',
    secretOnceWarning: 'developerPortal.dashboards.tabs.webhooks.secretOnceWarning',
    previousSecretExpires: 'developerPortal.dashboards.tabs.webhooks.previousSecretExpires',
    copySecret: 'developerPortal.dashboards.tabs.webhooks.copySecret',
    sendTest: 'developerPortal.dashboards.tabs.webhooks.sendTest',
    testNeedsUrl: 'developerPortal.dashboards.tabs.webhooks.testNeedsUrl',
    testDelivered: 'developerPortal.dashboards.tabs.webhooks.testDelivered',
    testFailedStatus: 'developerPortal.dashboards.tabs.webhooks.testFailedStatus',
    testFailedTimeout: 'developerPortal.dashboards.tabs.webhooks.testFailedTimeout',
    testRequestFailed: 'developerPortal.dashboards.tabs.webhooks.testRequestFailed',
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

const showTab = (project: LCNIntegration = integration): void => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
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
    state.rotateIntegrationWebhookSecret.mockReset().mockResolvedValue({ secret: SECRET });
    state.sendIntegrationTestEvent.mockReset().mockResolvedValue({ delivered: true, status: 204 });
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
            expect(state.updateIntegration).toHaveBeenCalledWith(integration.id, {
                webhookUrl: WEBHOOK_URL,
            })
        );
    });

    it('removes the saved webhook URL with null', async () => {
        showTab(configured);
        expect(screen.getByRole('textbox', { name: t('urlTitle') })).toHaveValue(WEBHOOK_URL);
        expect(screen.getByRole('button', { name: t('saveUrl') })).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: t('removeUrl') }));

        await waitFor(() =>
            expect(state.updateIntegration).toHaveBeenCalledWith(configured.id, {
                webhookUrl: null,
            })
        );
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

    it('reveals a first secret once, with a copy button and the one-time warning', async () => {
        showTab();
        expect(screen.getByText(t('secretNone'))).toBeInTheDocument();
        expect(screen.queryByTestId('webhook-secret')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: t('createSecret') }));

        expect(await screen.findByTestId('webhook-secret')).toHaveTextContent(SECRET);
        expect(state.rotateIntegrationWebhookSecret).toHaveBeenCalledWith(integration.id);
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
        expect(await screen.findByText(t('testDelivered', { status: 204 }))).toBeInTheDocument();
        expect(state.sendIntegrationTestEvent).toHaveBeenCalledWith(configured.id);
    });

    it('shows the HTTP status of a rejected test event', async () => {
        state.sendIntegrationTestEvent.mockResolvedValue({
            delivered: false,
            status: 500,
            error: 'http_500',
        });
        showTab(configured);
        fireEvent.click(screen.getByRole('button', { name: t('sendTest') }));
        expect(await screen.findByText(t('testFailedStatus', { status: 500 }))).toBeInTheDocument();
    });

    it('explains a test event that got no answer and shows its error code', async () => {
        state.sendIntegrationTestEvent.mockResolvedValue({ delivered: false, error: 'timeout' });
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
