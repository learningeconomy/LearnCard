import { vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const completion = vi.hoisted(() => ({ percentage: 0, isFetched: false }));

vi.mock('@ionic/react', () => ({
    IonPage: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    IonContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('react-error-boundary', () => ({
    ErrorBoundary: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../components/main-header/MainHeader', () => ({ default: () => null }));
vi.mock('../../components/main-subheader/MainSubHeader.types', () => ({
    SubheaderTypeEnum: { AiPathways: 'AiPathways' },
}));
vi.mock('./ai-pathways-skill-profile/MySkillProfile', () => ({
    default: () => <div data-testid="skill-profile" />,
}));
vi.mock('../../components/ai-feature-links/AiFeatureLinks', () => ({ default: () => null }));
vi.mock('../../components/boost/boostErrors/BoostErrorsDisplay', () => ({ default: () => null }));
vi.mock('./ai-pathways-what-would-you-like-to-do/AiPathwaysWhatWouldYouLikeToDoCard', () => ({
    default: () => <div data-testid="pathways-actions" />,
}));
vi.mock('../../components/ai-feature-gate/AiFeatureGate', () => ({
    AiFeatureGate: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    default: () => ({
        getThemedCategoryColors: () => ({ backgroundSecondaryColor: 'white' }),
    }),
}));
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: { aiPathway: 'AI Pathway' },
}));
vi.mock('./GrowSkillsPathwaysHome', () => ({ default: () => null }));
vi.mock('./ai-pathways-skill-profile/SkillProfileProgressBar', () => ({
    useSkillProfileCompletion: () => completion,
}));
vi.mock('./useGrowSkillsContent', () => ({
    useGrowSkillsContent: () => ({
        careerKeywords: undefined,
        occupations: undefined,
        isLoading: false,
    }),
}));
vi.mock('./ai-pathway-careers/AiPathwayCareerItem', () => ({ default: () => null }));
vi.mock('./ai-pathway-careers/AiPathwayCareers', () => ({ default: () => null }));

import AiPathways from './AiPathways';

const isBefore = (left: HTMLElement, right: HTMLElement): boolean =>
    Boolean(left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('AiPathways action card ordering', () => {
    beforeEach(() => {
        completion.percentage = 0;
        completion.isFetched = false;
    });

    it('waits for profile data and keeps the initial non-empty ordering', async () => {
        const { rerender } = render(<AiPathways />);

        expect(screen.queryByTestId('pathways-actions')).toBeNull();

        completion.percentage = 63;
        completion.isFetched = true;
        rerender(<AiPathways />);

        await waitFor(() => expect(screen.queryByTestId('pathways-actions')).not.toBeNull());

        const actions = screen.getByTestId('pathways-actions');
        const profile = screen.getByTestId('skill-profile');
        expect(isBefore(actions, profile)).toBe(true);

        completion.percentage = 0;
        rerender(<AiPathways />);

        expect(isBefore(actions, profile)).toBe(true);
    });

    it('places actions after an initially empty fetched profile', async () => {
        const { rerender } = render(<AiPathways />);

        completion.isFetched = true;
        rerender(<AiPathways />);

        await waitFor(() => expect(screen.queryByTestId('pathways-actions')).not.toBeNull());

        expect(
            isBefore(screen.getByTestId('skill-profile'), screen.getByTestId('pathways-actions'))
        ).toBe(true);
    });
});
