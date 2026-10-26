import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const host = vi.hoisted(() => ({
    available: true,
    contracts: [] as Array<{ contract: { uri: string }; status: string }>,
}));
vi.mock('learn-card-base', () => ({
    ModalTypes: {},
    useGetCredentialList: vi.fn(),
    useModal: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    useConsentedContracts: () => ({ data: host.contracts }),
}));
vi.mock('../components/ai-passport-apps/aiPassport-apps.helpers', () => ({
    aiPassportApps: ['learncard', 'chatgpt', 'claude', 'gemini'].map(contractUri => ({
        contractUri,
    })),
    areAiPassportAppsAvailable: () => host.available,
}));
vi.mock('../pages/consentFlow/useConsentFlow', () => {
    throw new Error('Consent status must not load the consent UI');
});
vi.mock('../components/new-ai-session/LazyNewAiSessionContainer', () => ({ default: () => null }));
import { useHasConsentedToAiApp } from './useAiSession';
beforeEach(() => {
    host.available = true;
    host.contracts = [];
});
afterEach(cleanup);
it('reads consent status from cached records without loading consent UI or contract details', () => {
    host.contracts = [{ contract: { uri: 'chatgpt' }, status: 'live' }];
    const { result } = renderHook(useHasConsentedToAiApp);
    expect(result.current.hasConsentedToAiApps).toBe(true);
});
it('preserves network availability, withdrawn status, and the existing supported app set', () => {
    const { result, rerender } = renderHook(useHasConsentedToAiApp);
    expect(result.current.hasConsentedToAiApps).toBe(false);
    host.contracts = [{ contract: { uri: 'claude' }, status: 'withdrawn' }];
    rerender();
    expect(result.current.hasConsentedToAiApps).toBe(false);
    host.contracts = [{ contract: { uri: 'gemini' }, status: 'live' }];
    rerender();
    expect(result.current.hasConsentedToAiApps).toBe(false);
    host.contracts = [{ contract: { uri: 'learncard' }, status: 'live' }];
    rerender();
    expect(result.current.hasConsentedToAiApps).toBe(true);
    host.available = false;
    rerender();
    expect(result.current.hasConsentedToAiApps).toBe(false);
});
