import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LEARNCARD_AI_PASSPORT_CONTRACT_URI } from 'learn-card-base/constants/aiPassport';
import type { LaunchPadAppListItem } from 'learn-card-base';
import AiSessionAppSelector from './AiSessionAppSelector';
const open = vi.hoisted(() => vi.fn());
vi.mock('learn-card-base', () => ({ useModal: () => ({ closeModal: vi.fn() }) }));
vi.mock('apps/learn-card-app/src/pages/consentFlow/useConsentFlow', () => ({
    useConsentFlowByUri: () => ({ openConsentFlowModal: open, hasConsented: false }),
}));
vi.mock('../../../theme/hooks/useTheme', () => ({ default: () => ({ colors: {} }) }));
vi.mock('../../../paraglide/messages.js', () => ({ m: { 'ai.get': () => 'Get' } }));
vi.mock('../../ai-passport-apps/aiPassport-apps.helpers', () => ({ aiPassportApps: [] }));
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});
it.each([
    [LEARNCARD_AI_PASSPORT_CONTRACT_URI, true],
    ['lc:contract:other', false],
])('scopes redirect suppression to in-app LearnCard AI (%s)', (contractUri, disabled) => {
    render(
        <AiSessionAppSelector
            handleSetAiApp={vi.fn()}
            apps={[{ name: 'App', contractUri } as LaunchPadAppListItem]}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Get' }));
    expect(open).toHaveBeenCalledWith(true, expect.any(Function), undefined, undefined, disabled);
});
