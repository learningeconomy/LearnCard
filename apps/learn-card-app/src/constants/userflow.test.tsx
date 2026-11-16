// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const state = vi.hoisted(() => ({
    analyticsEnabled: false,
    tenantEnabled: true,
    tenantResolved: true,
    identityKey: null as string | null,
    getDID: vi.fn(async () => 'did:key:account'),
}));

vi.mock('learn-card-base/hooks/usePrivacyGate', () => ({
    usePrivacyConsent: () => ({
        analyticsEnabled: state.analyticsEnabled,
        identityKey: state.identityKey,
    }),
}));
vi.mock('learn-card-base/hooks/useGetCurrentUser', () => ({
    default: () => ({ uid: 'account' }),
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ getDID: state.getDID }),
    getLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));
vi.mock('../components/share-links/sharePrivacy', () => ({
    isSharePrivateSession: () => false,
}));
vi.mock('../config/tenantConfigState', () => ({
    isTenantAnalyticsEnabled: () => state.tenantEnabled,
    getResolvedTenantConfig: () => {
        if (!state.tenantResolved) throw new Error('Tenant config is unresolved');
        return { observability: { userflowToken: 'tenant-token' } };
    },
}));

import userflow from 'userflow.js';
import { useUserflowIdentify } from './userflow';

const userflowWindow = window as Window & {
    USERFLOWJS_QUEUE?: unknown[];
};

describe('Userflow consent lifecycle', () => {
    beforeEach(() => {
        state.analyticsEnabled = false;
        state.tenantEnabled = true;
        state.tenantResolved = true;
        state.identityKey = null;
        state.getDID.mockClear();
        userflowWindow.USERFLOWJS_QUEUE = [];
        document.querySelectorAll('script[src*="userflow.com"]').forEach(script => script.remove());
    });

    afterEach(() => {
        document.querySelectorAll('script[src*="userflow.com"]').forEach(script => script.remove());
    });

    it('does not load or queue Userflow calls while consent is unresolved or denied', () => {
        const { rerender } = renderHook(() => useUserflowIdentify());
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
        expect(document.querySelector('script[src*="userflow.com"]')).toBeNull();
        expect(state.getDID).not.toHaveBeenCalled();

        state.identityKey = 'account/profile-a';
        rerender();
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
        expect(document.querySelector('script[src*="userflow.com"]')).toBeNull();
    });

    it('keeps the SDK and its queue untouched when tenant analytics policy is disabled', () => {
        state.analyticsEnabled = true;
        state.identityKey = 'account/profile-a';
        state.tenantEnabled = false;
        renderHook(() => useUserflowIdentify());
        expect(document.querySelector('script[src*="userflow.com"]')).toBeNull();
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
    });

    it('loads no fallback project if tenant lookup fails after consent resolves', () => {
        state.analyticsEnabled = true;
        state.identityKey = 'account/profile-a';
        state.tenantResolved = false;
        renderHook(() => useUserflowIdentify());
        expect(document.querySelector('script[src*="userflow.com"]')).toBeNull();
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
    });

    it('loads only after consent and does not enqueue identify while the SDK script is pending', () => {
        state.analyticsEnabled = true;
        state.identityKey = 'account/profile-a';
        const { unmount } = renderHook(() => useUserflowIdentify());

        expect(document.querySelector('script[src*="userflow.com"]')).not.toBeNull();
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
        expect(state.getDID).not.toHaveBeenCalled();

        unmount();
        expect(userflowWindow.USERFLOWJS_QUEUE).toHaveLength(0);
    });
});
