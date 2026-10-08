import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeManifestForUrl } from '@learncard/partner-connect-core';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';

import PublishSignInGate from './PublishSignInGate';
import { PUBLISH_RESUME_KEY, consumePublishResume } from './publishResume';

const mocks = vi.hoisted(() => ({ setLcnRedirect: vi.fn() }));

vi.mock('learn-card-base', () => ({
    redirectStore: { set: { lcnRedirect: mocks.setLcnRedirect } },
}));

vi.mock('learn-card-base/config/TenantConfigProvider', () => ({
    useBrandingConfig: () => ({ name: 'LearnCard' }),
}));

vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: {} } }),
}));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => <span />,
}));

const manifest: CapturedAppManifest = {
    manifestVersion: 1,
    appUrl: 'https://abc123.lovableproject.com/',
    suggestedName: 'Quiz Quest',
    permissions: ['request_identity', 'send_credential'],
    templates: [
        {
            alias: 'course-complete',
            template: { name: 'Course Complete' },
            version: 1,
            lastUsedAt: '2026-01-01T00:00:00.000Z',
        },
    ],
    consentRequests: [],
    featuresLaunched: [],
    counterKeys: ['coins'],
    usedLearnerContext: false,
    usedNotifications: true,
    firstCapturedAt: '2026-01-01T00:00:00.000Z',
    lastUpdatedAt: '2026-01-01T00:00:00.000Z',
};

const renderAt = (search: string) =>
    render(
        <MemoryRouter initialEntries={[`/app-store/developer/submit${search}`]}>
            <Route path="/app-store/developer/submit" component={PublishSignInGate} />
            <Route path="/login" render={() => <div>Login page</div>} />
        </MemoryRouter>
    );

describe('PublishSignInGate', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    it('shows the app being published and what was captured', () => {
        renderAt(`?manifest=${encodeManifestForUrl(manifest)}`);

        expect(screen.getByText('Publish Quiz Quest to LearnCard')).toBeInTheDocument();
        expect(screen.getByText('abc123.lovableproject.com')).toBeInTheDocument();
        expect(screen.getByText('Signs people in with their account')).toBeInTheDocument();
        expect(screen.getByText('Gives out 1 kind of credential')).toBeInTheDocument();
        expect(screen.getByText('Sends notifications')).toBeInTheDocument();
        expect(screen.getByText('Tracks progress')).toBeInTheDocument();
    });

    it('saves the exact publish link before sending the visitor to sign up', () => {
        const search = `?manifest=${encodeManifestForUrl(manifest)}`;
        renderAt(search);

        fireEvent.click(screen.getByRole('button', { name: /Create Free Account/ }));

        expect(mocks.setLcnRedirect).toHaveBeenCalledWith(`/app-store/developer/submit${search}`);
        expect(sessionStorage.getItem(PUBLISH_RESUME_KEY)).toBe('1');
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('offers sign in for existing accounts with the same resume behavior', () => {
        renderAt(`?manifest=${encodeManifestForUrl(manifest)}`);

        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        expect(mocks.setLcnRedirect).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('explains a broken link instead of asking for an account', () => {
        renderAt('?manifest=not-a-manifest');

        expect(screen.getByText("This publish link doesn't work")).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Create Free Account/ })).toBeNull();
    });
});

describe('consumePublishResume', () => {
    it('reports a pending resume exactly once', () => {
        sessionStorage.setItem(PUBLISH_RESUME_KEY, '1');

        expect(consumePublishResume()).toBe(true);
        expect(consumePublishResume()).toBe(false);
    });
});
