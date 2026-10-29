import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Historical pathways from the retired ChatGPT and Claude tutors must stay
 * readable, but Start can't launch anything: their contracts no longer
 * resolve to an app, so there's no URL to send the user to.
 */

const closeAllModals = vi.hoisted(() => vi.fn());
const closeModal = vi.hoisted(() => vi.fn());

vi.mock('learn-card-base', () => ({
    getLearnCardAiPassportContractUri: () => 'lc:contract:learncard-ai',
    useModal: () => ({ closeAllModals, closeModal }),
}));
vi.mock('learn-card-base/helpers/networkHelpers', () => ({
    isProductionNetwork: () => true,
}));
vi.mock('learn-card-base/stores/NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: () => 'http://localhost:3001' } },
}));
vi.mock('learn-card-base/svgs/Checkmark', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/LockSimple', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/IDSleeve', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/NewAiSessionIcon', () => ({ default: () => null }));
vi.mock('@ionic/react', () => ({
    IonFooter: ({ children }: { children: React.ReactNode }) => <footer>{children}</footer>,
}));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ colors: { defaults: { primaryColor: 'indigo-500' } } }),
}));
vi.mock('../AiSessionLoader', () => ({
    default: () => <div data-testid="ai-session-loader" />,
}));
vi.mock('../LearnCardAiChatBot/LearnCardAiChatBot', () => ({
    LearnCardAiChatBot: () => <div data-testid="in-modal-chat" />,
}));
vi.mock('../newAiSession.helpers', () => ({
    getSessionLoadingText: () => 'Loading',
    getAiTopicTitle: () => 'Fractions',
}));

import AiSessionLearningPathwayPreview from './AiSessionLearningPathwayPreview';
import { AiPassportAppContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';
import type { LearningPathway } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import type { LCR } from 'learn-card-base/types/credential-records';
import type { Boost } from '@learncard/types';

const RETIRED_CONTRACTS = {
    chatGPT: 'lc:network:network.learncard.com/trpc:contract:469524d4-264c-4fc3-99e4-0c9f06c805e8',
    claude: 'lc:network:network.learncard.com/trpc:contract:5d5447fc-9197-45ac-859a-5f068ff12938',
};

const learningPathway: LearningPathway = {
    id: 1,
    title: 'Adding fractions',
    completed: false,
    lastUpdated: '2026-10-01T00:00:00.000Z',
    summary: 'Fractions practice',
    description: 'Practice adding fractions with unlike denominators.',
    learned: [],
    skills: [{ title: 'Common denominators', description: 'Find a shared denominator.' }],
    nextSteps: [],
};

const renderPreview = (contractUri: string) =>
    render(
        <AiSessionLearningPathwayPreview
            topicRecord={{ contractUri } as unknown as LCR}
            topicBoost={{ uri: 'boost:topic' } as unknown as Boost}
            pathwayBoost={{ uri: 'boost:pathway' } as unknown as Boost}
            learningPathway={learningPathway}
        />
    );

const START_PATH = '/pathway-preview';
const startHref = () => new URL(START_PATH, window.location.origin).href;

describe('AiSessionLearningPathwayPreview', () => {
    beforeEach(() => {
        window.history.replaceState({}, '', START_PATH);
        closeAllModals.mockClear();
    });

    afterEach(() => {
        window.history.replaceState({}, '', START_PATH);
    });

    describe.each(Object.entries(RETIRED_CONTRACTS))(
        'retired %s contract',
        (_name, contractUri) => {
            it('keeps the pathway history readable', () => {
                renderPreview(contractUri);

                expect(screen.getByText('Adding fractions')).toBeInTheDocument();
                expect(
                    screen.getByText('Practice adding fractions with unlike denominators.')
                ).toBeInTheDocument();
                expect(screen.getByText('Common denominators')).toBeInTheDocument();
                expect(screen.getByText('Find a shared denominator.')).toBeInTheDocument();
                expect(screen.getByRole('status')).toHaveTextContent('Session unavailable');
            });

            it('disables Start and never launches or navigates', async () => {
                renderPreview(contractUri);

                const start = screen.getByRole('button', { name: /start/i });
                expect(start).toBeDisabled();

                await userEvent.click(start);

                expect(window.location.href).toBe(startHref());
                expect(closeAllModals).not.toHaveBeenCalled();
                expect(screen.queryByTestId('ai-session-loader')).not.toBeInTheDocument();
                expect(screen.queryByTestId('in-modal-chat')).not.toBeInTheDocument();
                // Close still works, so the user can leave the preview.
                expect(screen.getByRole('button', { name: 'Close' })).toBeEnabled();
            });
        }
    );

    it('still opens LearnCard AI pathways in the modal chat', async () => {
        renderPreview(AiPassportAppContractUri.learncardapp);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: /start/i }));

        expect(screen.getByTestId('in-modal-chat')).toBeInTheDocument();
        expect(window.location.href).toBe(startHref());
    });
});
