// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    TranscriptPromptSheet,
    getTranscriptPromptKey,
    markTranscriptPromptOffered,
    useTranscriptPrompt,
} from './useTranscriptPrompt';
import {
    keepAccountAskedThisSession,
    resetKeepAccountSessionForTests,
} from '../components/classlink/keepAccountSession';

type FlowProps = { onDone: (result: { requested: boolean; arrived: boolean }) => void };
type StepProps = Record<
    'onComplete' | 'onDismiss' | 'onBeforeOverlay' | 'onOverlayComplete',
    () => void
> & {
    variant: string;
    source: string;
};

const mocks = vi.hoisted(() => ({
    isLoggedIn: true,
    isOnboardingOpen: false,
    status: 'ready',
    classlinkTranscriptOptIn: true,
    transcriptStatus: {
        isLoading: false,
        isError: false,
        data: {
            eligible: true,
            reason: undefined as string | undefined,
            latest: undefined as { status: string } | undefined,
        },
    },
    newModal: vi.fn(),
    closeModal: vi.fn(),
    initWallet: vi.fn().mockResolvedValue({
        id: { did: () => 'did:test:123' },
    }),
    keepAccountOffer: false,
    keepAccountStep: 'email',
    providerOverlayOpen: false,
    flow: undefined as FlowProps | undefined,
    step: undefined as StepProps | undefined,
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: vi.fn() }) }));
vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => mocks.isLoggedIn,
    useFeatureConfig: () => ({ classlinkTranscriptOptIn: mocks.classlinkTranscriptOptIn }),
    useTranscriptStatus: () => mocks.transcriptStatus,
    useModal: () => ({ newModal: mocks.newModal, closeModal: mocks.closeModal }),
    ModalTypes: { Center: 'center', BottomSheet: 'bottom-sheet' },
    useWallet: () => ({ initWallet: mocks.initWallet }),
    redirectStore: { use: { isOnboardingOpen: () => mocks.isOnboardingOpen } },
    getLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));
vi.mock('../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: { status: mocks.status },
        providerOverlayOpen: mocks.providerOverlayOpen,
    }),
}));
vi.mock('../components/classlink/TranscriptRequestFlow', () => ({
    TranscriptRequestFlow: (props: FlowProps) => {
        mocks.flow = props;
        return <div data-testid="mock-transcript-flow" />;
    },
}));
vi.mock('../components/classlink/KeepAccountStep', () => ({
    KeepAccountStep: (props: StepProps) => {
        mocks.step = props;
        return <div data-testid="mock-keep-account" />;
    },
}));
vi.mock('../components/classlink/useKeepAccountOffer', () => ({
    useKeepAccountOffer: () => ({
        offer: mocks.keepAccountOffer,
        continuity: { nextStep: mocks.keepAccountStep },
    }),
}));

const memoryStorage = (() => {
    const store = new Map<string, string>();
    return {
        get length() {
            return store.size;
        },
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        key: (index: number) => [...store.keys()][index] ?? null,
        removeItem: (key: string) => void store.delete(key),
        setItem: (key: string, value: string) => void store.set(key, String(value)),
    } as Storage;
})();
vi.stubGlobal('localStorage', memoryStorage);

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.isLoggedIn = true;
    mocks.isOnboardingOpen = false;
    mocks.status = 'ready';
    mocks.classlinkTranscriptOptIn = true;
    mocks.keepAccountOffer = false;
    mocks.keepAccountStep = 'email';
    mocks.providerOverlayOpen = false;
    mocks.flow = undefined;
    mocks.step = undefined;
    mocks.transcriptStatus = {
        isLoading: false,
        isError: false,
        data: {
            eligible: true,
            reason: undefined,
            latest: undefined,
        },
    };
});

describe('useTranscriptPrompt', () => {
    it('shows prompt when eligible and no latest request', async () => {
        renderHook(() => useTranscriptPrompt());

        // Wait for async checkAndShowPrompt
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('does not show prompt when not logged in', async () => {
        mocks.isLoggedIn = false;
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('does not show prompt when onboarding is open', async () => {
        mocks.isOnboardingOpen = true;
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('does not show prompt when feature flag is off', async () => {
        mocks.classlinkTranscriptOptIn = false;
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('does not show prompt when not eligible', async () => {
        mocks.transcriptStatus.data.eligible = false;
        mocks.transcriptStatus.data.reason = 'no_state_id';
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('does not show prompt when there is a latest request', async () => {
        mocks.transcriptStatus.data.latest = { status: 'requested' };
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('remembers dismissal and does not show again within 14 days', async () => {
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).toHaveBeenCalledTimes(1);

        // Simulate dismiss
        const did = 'did:test:123';
        const hash = Array.from(did).reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
        const storageKey = `transcript_prompt_dismissed_${hash}`;
        localStorage.setItem(storageKey, Date.now().toString());

        mocks.newModal.mockClear();
        // We need to remount to test the ref state reset, but renderHook in testing-library
        // preserves the component state if we just rerender. We'll use a new renderHook.
        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('waits for a provider overlay (e.g. the first-time PIN prompt) instead of stacking', async () => {
        mocks.providerOverlayOpen = true;
        const { rerender } = renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();

        mocks.providerOverlayOpen = false;
        rerender();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });

    it('waits 14 days after the onboarding transcript step was skipped', async () => {
        markTranscriptPromptOffered('did:test:123');
        expect(localStorage.getItem(getTranscriptPromptKey('did:test:123'))).not.toBeNull();
        expect(getTranscriptPromptKey('did:test:123')).not.toContain('did:test');

        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).not.toHaveBeenCalled();
    });

    it('shows again after 14 days', async () => {
        const did = 'did:test:123';
        const hash = Array.from(did).reduce((s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0, 0);
        const storageKey = `transcript_prompt_dismissed_${hash}`;

        // Set dismissal to 15 days ago
        const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
        localStorage.setItem(storageKey, fifteenDaysAgo.toString());

        renderHook(() => useTranscriptPrompt());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(mocks.newModal).toHaveBeenCalledTimes(1);
    });
});

describe('TranscriptPromptSheet', () => {
    const finish = (result: { requested: boolean; arrived: boolean }): void => {
        act(() => mocks.flow?.onDone(result));
    };

    beforeEach(() => {
        cleanup();
        resetKeepAccountSessionForTests();
    });

    it('chains into keeping the account once the server reports the transcript arrived', () => {
        mocks.keepAccountOffer = true;
        const onClose = vi.fn();
        render(<TranscriptPromptSheet stateDisplayName="Example" onClose={onClose} />);
        finish({ requested: true, arrived: true });

        expect(onClose).not.toHaveBeenCalled();
        expect(screen.queryByTestId('mock-transcript-flow')).toBeNull();
        expect(screen.getByTestId('mock-keep-account')).toBeTruthy();
        expect(mocks.step).toMatchObject({ variant: 'sheet', source: 'transcript_modal' });
        // Asked here: the dashboard banner waits for a later session, however it closes.
        expect(keepAccountAskedThisSession()).toBe(true);

        // A provider overlay sits below the modal stack, so the sheet closes first...
        mocks.step?.onBeforeOverlay();
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('reopens the keep-account step after the overlay so it can confirm in place', () => {
        mocks.keepAccountOffer = true;
        const onReopen = vi.fn();
        render(
            <TranscriptPromptSheet
                stateDisplayName="Example"
                onClose={vi.fn()}
                onReopenKeepAccount={onReopen}
            />
        );
        finish({ requested: true, arrived: true });
        mocks.step?.onOverlayComplete();
        expect(onReopen).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['the transcript has not arrived', true, false, 'email'],
        ['the server offers nothing', false, true, 'email'],
        ['only a PIN is left (asked elsewhere)', true, true, 'pin'],
    ])('closes when %s', (_label, offer, arrived, nextStep) => {
        mocks.keepAccountOffer = offer;
        mocks.keepAccountStep = nextStep;
        const onClose = vi.fn();
        render(<TranscriptPromptSheet stateDisplayName="Example" onClose={onClose} />);
        finish({ requested: true, arrived });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId('mock-keep-account')).toBeNull();
        expect(keepAccountAskedThisSession()).toBe(false);
    });
});
