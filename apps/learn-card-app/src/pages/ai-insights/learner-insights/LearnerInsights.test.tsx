import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LearnerInsights from './LearnerInsights';

const state = vi.hoisted(() => ({
    modal: vi.fn(),
    seen: vi.fn(),
    refetch: vi.fn(),
    requests: [
        {
            profile: { profileId: 'legacy', displayName: 'Legacy Learner' },
            status: 'accepted',
            readStatus: 'unseen',
        },
        {
            profile: { profileId: 'referred', displayName: 'Referred Learner' },
            status: 'accepted',
            readStatus: 'unseen',
            requestId: 'referral-1',
        },
    ],
}));
vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: async () => ({}) }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: undefined }),
    useGetCurrentUserRole: () => 'teacher',
    useGetContracts: () => ({ data: { records: [] }, isLoading: true }),
    useContract: () => ({ data: undefined }),
    useContractSentRequests: () => ({ data: state.requests, refetch: state.refetch }),
    useModal: () => ({ newModal: state.modal }),
    useConfirmation: () => vi.fn(),
    useMarkContractRequestAsSeen: () => ({ mutateAsync: state.seen }),
    useCancelContractRequest: () => ({ mutateAsync: vi.fn() }),
    switchedProfileStore: { use: { profileType: () => 'teacher' } },
    UserProfilePicture: () => null,
    ModalTypes: { Right: 'right' },
}));
vi.mock('../../../theme/hooks/useTheme', () => ({
    useTheme: () => ({ getIconSet: () => ({ floatingBottle: () => null }) }),
}));
vi.mock('../../../components/onboarding/onboarding.helpers', () => ({
    LearnCardRolesEnum: { teacher: 'teacher' },
}));
vi.mock('../request-insights/request-insights.helpers', () => ({
    RequestInsightStatusEnum: { pending: 'pending', accepted: 'accepted' },
    createTeacherStudentContract: vi.fn(),
}));
vi.mock('./learner-insights.helpers', () => ({
    LearnerInsightsFilterOptionsEnum: { all: 'all' },
    LearnerInsightsSortOptionsEnum: { recentlyAdded: 'recent', alphabetical: 'alphabetical' },
    useGetAiInsightsServicesContract: () => ({}),
    createAiInsightsService: vi.fn(),
}));
vi.mock('../../consentFlow/useConsentFlow', () => ({ default: () => ({}) }));
vi.mock('../request-insights/RequestInsightsCard', () => ({ default: () => null }));
vi.mock('./LearnerInsightsSearch', () => ({ default: () => null }));
vi.mock('../share-insights/ShareInsightsWithUser', () => ({ default: () => null }));
vi.mock('../request-insights/RequestInsightsFromUserModal', () => ({ default: () => null }));
vi.mock('../request-insights/RequestInsightsUserCardOptions', () => ({ default: () => null }));
vi.mock('./LearnerInsightsSkillsCount', () => ({ default: () => null }));
vi.mock('./LearnerInsightsPreview', () => ({ default: () => null }));
vi.mock('@learncard/react', () => ({ ThreeDotVertical: () => null }));
vi.mock('learn-card-base/svgs/Checkmark', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/SkinnyCaretRight', () => ({ default: () => null }));
beforeEach(() => {
    vi.clearAllMocks();
    state.seen.mockResolvedValue(true);
    state.refetch.mockResolvedValue(undefined);
});
afterEach(cleanup);
it('opens previews from a mixed list while preserving learner-only referral seen state', async () => {
    render(<LearnerInsights />);
    fireEvent.click(screen.getByText('Referred Learner'));
    await waitFor(() => expect(state.modal).toHaveBeenCalledTimes(1));
    expect(state.modal.mock.calls[0][0].props.profile.profileId).toBe('referred');
    expect(state.seen).not.toHaveBeenCalled();
    expect(state.refetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Legacy Learner'));
    await waitFor(() => expect(state.modal).toHaveBeenCalledTimes(2));
    expect(state.modal.mock.calls[1][0].props.profile.profileId).toBe('legacy');
    expect(state.seen).toHaveBeenCalledExactlyOnceWith({
        contractUri: '',
        targetProfileId: 'legacy',
    });
    expect(state.refetch).toHaveBeenCalledTimes(1);
    expect(state.requests[1].readStatus).toBe('unseen');
});
