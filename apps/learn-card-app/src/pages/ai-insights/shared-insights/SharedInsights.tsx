import React, { useMemo, useState } from 'react';

import LearnerInsightsSearch from '../learner-insights/LearnerInsightsSearch';
import { useConsentFlowByUri } from '../../consentFlow/useConsentFlow';

import {
    useGetCurrentLCNUser,
    useSharedInsightsRequestsForProfile,
    UserProfilePicture,
} from 'learn-card-base';
import { LCNProfile } from '@learncard/types';
import { useTheme } from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

import {
    LearnerInsightsFilterOptionsEnum,
    LearnerInsightsSortOptionsEnum,
} from '../learner-insights/learner-insights.helpers';

type SharedRequest = {
    profile: LCNProfile;
    status: 'pending' | 'accepted' | 'denied' | null;
    readStatus?: 'unseen' | 'seen' | null;
    contractUri?: string;
};

const SharedInsightsRow: React.FC<{ request: SharedRequest; refetch: () => void }> = ({
    request,
    refetch,
}) => {
    const { openConsentFlowModal } = useConsentFlowByUri(request.contractUri);

    const isAccepted = request.status === 'accepted';

    const handleRowClick = () => {
        if (!isAccepted || !request.contractUri) return;
        openConsentFlowModal(
            true,
            async () => {
                await refetch();
            },
            request?.profile,
            undefined,
            true,
            async () => {
                await refetch();
            }
        );
    };

    return (
        <div
            key={request.profile.profileId}
            className={`w-full bg-white rounded-[15px] shadow-soft-bottom py-4 px-2 flex items-center justify-between ${
                isAccepted ? 'cursor-pointer active:opacity-70' : ''
            }`}
            onClick={handleRowClick}
        >
            <div className="flex items-center gap-2">
                <UserProfilePicture
                    customContainerClass="flex justify-center items-center rounded-full overflow-hidden border-white border-solid border-[3px] text-white font-medium text-xl h-[60px] w-[60px] min-w-[60px] min-h-[60px]"
                    customImageClass="flex justify-center items-center rounded-full overflow-hidden object-cover border-white border-solid border-2 h-[60px] w-[60px] min-w-[60px] min-h-[60px]"
                    customSize={120}
                    user={request.profile}
                />

                <div className="flex flex-col text-left">
                    <p className="text-grayscale-900 text-[17px] font-semibold">
                        {request.profile.displayName}
                    </p>
                    <p className="text-grayscale-600 text-sm font-semibold">
                        {request.profile.role && (
                            <span className="font-semibold capitalize">
                                {request.profile.role} •{' '}
                            </span>
                        )}
                        {request.status === 'accepted' ? (
                            <span className="font-semibold text-emerald-700">Accepted</span>
                        ) : request.status === 'pending' ? (
                            <span className="font-semibold text-indigo-600">Pending</span>
                        ) : request.status === 'denied' ? (
                            <span className="font-semibold text-rose-600">Denied</span>
                        ) : (
                            <span className="font-semibold text-grayscale-600">Unknown</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

const SharedInsights: React.FC = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const [filterBy, setFilterBy] = useState<LearnerInsightsFilterOptionsEnum>(
        LearnerInsightsFilterOptionsEnum.all
    );
    const [sortBy, setSortBy] = useState<LearnerInsightsSortOptionsEnum>(
        LearnerInsightsSortOptionsEnum.recentlyAdded
    );
    const [searchInput, setSearchInput] = useState<string>('');

    const { data: sharedRequests = [], refetch } = useSharedInsightsRequestsForProfile(
        currentLCNUser?.profileId ?? '',
        Boolean(currentLCNUser?.profileId)
    );

    const filteredRequests = useMemo(() => {
        let requests = [...sharedRequests];

        if (filterBy === LearnerInsightsFilterOptionsEnum.pending) {
            requests = requests.filter(request => request.status === 'pending');
        } else if (filterBy === LearnerInsightsFilterOptionsEnum.accepted) {
            requests = requests.filter(request => request.status === 'accepted');
        }

        if (searchInput) {
            const searchInputNormalized = searchInput.toLowerCase();
            requests = requests.filter(request =>
                request.profile.displayName.toLowerCase().includes(searchInputNormalized)
            );
        }

        if (sortBy === LearnerInsightsSortOptionsEnum.recentlyAdded) {
            requests = requests.reverse();
        } else if (sortBy === LearnerInsightsSortOptionsEnum.alphabetical) {
            requests = requests.sort((a, b) =>
                a.profile.displayName.localeCompare(b.profile.displayName)
            );
        }

        return requests;
    }, [sharedRequests, filterBy, searchInput, sortBy]);

    const showNoSearchResults = searchInput.length > 0 && filteredRequests.length === 0;
    const showNoSharedInsights = searchInput.length === 0 && filteredRequests.length === 0;

    return (
        <>
            <LearnerInsightsSearch
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            <div className="w-full flex flex-col gap-2">
                {filteredRequests.map(request => (
                    <SharedInsightsRow
                        key={request.profile.profileId}
                        request={request}
                        refetch={refetch}
                    />
                ))}

                {(showNoSearchResults || showNoSharedInsights) && (
                    <section className="flex flex-col items-center justify-center my-[30px]">
                        <FloatingBottleIcon />
                        <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                            {showNoSearchResults ? 'No Search Results' : 'No Shared Insights'}
                        </p>
                    </section>
                )}
            </div>
        </>
    );
};

export default SharedInsights;
