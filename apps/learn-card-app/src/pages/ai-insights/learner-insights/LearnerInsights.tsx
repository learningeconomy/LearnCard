import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import RequestInsightsCard from '../request-insights/RequestInsightsCard';
import LearnerInsightsSearch from './LearnerInsightsSearch';
import AiInsightsUserCard from '../AiInsightsUserCard';

import {
    useGetContracts,
    useGetCurrentLCNUser,
    useGetCurrentUserRole,
    useContractSentRequests,
    useContract,
    useWallet,
} from 'learn-card-base';
import { useTheme } from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';

import {
    LearnerInsightsFilterOptionsEnum,
    LearnerInsightsSortOptionsEnum,
    createAiInsightsService,
} from './learner-insights.helpers';
import { AiInsightsUserCardMode } from '../ai-insights.helpers';
import { LearnCardRolesEnum } from '../../../components/onboarding/onboarding.helpers';
import { createTeacherStudentContract } from '../request-insights/request-insights.helpers';

const LearnerInsights: React.FC = () => {
    const { initWallet } = useWallet();

    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentUserRole = useGetCurrentUserRole();

    const { getIconSet } = useTheme();
    const icons = getIconSet(IconSetEnum.placeholders);
    const { floatingBottle: FloatingBottleIcon } = icons;

    const {
        data: paginatedContracts,
        refetch: refetchContracts,
        isLoading: contractsLoading,
    } = useGetContracts();
    const contracts = paginatedContracts?.records;

    const [contractUri, setContractUri] = useState<string>('');
    const [contract, setContract] = useState(null);

    const { data: _contract } = useContract(contractUri, !Boolean(contract));

    const createContract = async () => {
        const wallet = await initWallet();
        if (!currentLCNUser || currentUserRole !== LearnCardRolesEnum.teacher || contractUri)
            return;

        const existingTeacherContract = contracts?.find(c => c.name === 'AI Insights');

        if (existingTeacherContract) {
            setContractUri(existingTeacherContract.uri);
            setContract(existingTeacherContract);
            await createAiInsightsService(
                wallet,
                existingTeacherContract.uri,
                currentLCNUser?.profileId!,
                currentLCNUser?.did!
            );
            return;
        }

        const uri = await createTeacherStudentContract({
            teacherProfile: currentLCNUser!,
        });
        await createAiInsightsService(
            wallet,
            uri,
            currentLCNUser?.profileId!,
            currentLCNUser?.did!
        );

        setContractUri(uri);
        refetchContracts();
    };

    useEffect(() => {
        if (!contractsLoading) {
            createContract();
        }
    }, [contracts, currentLCNUser, contractsLoading]);

    const [filterBy, setFilterBy] = useState<LearnerInsightsFilterOptionsEnum>(
        LearnerInsightsFilterOptionsEnum.all
    );
    const [sortBy, setSortBy] = useState<LearnerInsightsSortOptionsEnum>(
        LearnerInsightsSortOptionsEnum.recentlyAdded
    );
    const [searchInput, setSearchInput] = useState<string>('');

    const { data: requests = [] } = useContractSentRequests(contractUri);

    let _requests = requests;

    if (filterBy === LearnerInsightsFilterOptionsEnum.pending) {
        _requests = _requests.filter(request => request.status === 'pending');
    } else if (filterBy === LearnerInsightsFilterOptionsEnum.accepted) {
        _requests = _requests.filter(request => request.status === 'accepted');
    }

    if (searchInput) {
        _requests = _requests.filter(request =>
            request.profile.displayName.toLowerCase().includes(searchInput.toLowerCase())
        );
    }

    if (sortBy === LearnerInsightsSortOptionsEnum.recentlyAdded) {
        _requests = [..._requests].reverse();
    } else if (sortBy === LearnerInsightsSortOptionsEnum.alphabetical) {
        _requests = [..._requests].sort((a, b) =>
            a.profile.displayName.localeCompare(b.profile.displayName)
        );
    }

    const showNoSearchResults = searchInput.length > 0 && _requests.length === 0;

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
            <RequestInsightsCard contractUri={contractUri} />
            <div className="w-full flex flex-col gap-2">
                {_requests.map(request => (
                    <AiInsightsUserCard
                        key={request.profile.profileId}
                        profile={request.profile}
                        mode={AiInsightsUserCardMode.View}
                        showOptions
                        status={request?.status}
                        readStatus={request?.readStatus}
                        contractUri={contractUri}
                        contract={contract || _contract}
                    />
                ))}

                {showNoSearchResults && (
                    <section className="flex flex-col items-center justify-center my-[30px]">
                        <FloatingBottleIcon />
                        <p className="font-poppins text-[17px] font-normal text-grayscale-900 mt-[10px]">
                            No Search Results
                        </p>
                    </section>
                )}
            </div>
        </>
    );
};

export default LearnerInsights;
