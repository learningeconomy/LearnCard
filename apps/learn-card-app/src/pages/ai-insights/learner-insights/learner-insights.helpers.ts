import { useState, useEffect } from 'react';

import { useWallet, useGetCurrentLCNUser } from 'learn-card-base';

import { ConsentFlowContractDetails } from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { createTeacherStudentContract } from '../request-insights/request-insights.helpers';

export enum LearnerInsightsSortOptionsEnum {
    alphabetical = 'alphabetical',
    recentlyAdded = 'recentlyAdded',
}

export enum LearnerInsightsFilterOptionsEnum {
    all = 'all',
    pending = 'pending',
    accepted = 'accepted',
}

export type LearnerInsightsSortOption = {
    id: number;
    title: string;
    type: LearnerInsightsSortOptionsEnum;
};

export type LearnerInsightsFilterOption = Omit<LearnerInsightsSortOption, 'type'> & {
    type: LearnerInsightsFilterOptionsEnum;
};

export const LEARNER_INSIGHTS_SORT_OPTIONS: LearnerInsightsSortOption[] = [
    {
        id: 1,
        title: 'A-Z',
        type: LearnerInsightsSortOptionsEnum.alphabetical,
    },
    {
        id: 2,
        title: 'Recently Added',
        type: LearnerInsightsSortOptionsEnum.recentlyAdded,
    },
];

export const LEARNER_INSIGHTS_FILTER_OPTIONS: LearnerInsightsFilterOption[] = [
    {
        id: 1,
        title: 'All',
        type: LearnerInsightsFilterOptionsEnum.all,
    },
    {
        id: 2,
        title: 'Pending',
        type: LearnerInsightsFilterOptionsEnum.pending,
    },
    {
        id: 3,
        title: 'Accepted',
        type: LearnerInsightsFilterOptionsEnum.accepted,
    },
];

export const getAiInsightsServices = async (wallet: BespokeLearnCard, did: string) => {
    const didDoc = await wallet.invoke.resolveDid(did);
    const service = didDoc.service?.find(service =>
        Array.isArray(service.type) ? service.type.includes('ShareInsights') : false
    );

    return service;
};

export const createAiInsightsService = async (
    wallet: BespokeLearnCard,
    uri: string,
    profileId: string,
    did: string
) => {
    if (!profileId || !uri) return;
    const service = await getAiInsightsServices(wallet, did);

    if (service) return service;

    if (!service) {
        const serviceEndpoint = `${
            IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
        }/passport?contractUri=${uri}&teacherProfileId=${profileId}&insightsConsent=true`;

        const serviceData = {
            id: uri,
            type: ['ConsentFlowContract', 'ShareInsights'],
            serviceEndpoint: serviceEndpoint,
        };

        // Add service endpoint
        try {
            await wallet.invoke.addDidMetadata({ service: [serviceData] });
        } catch (error) {
            console.error('Error adding service endpoint:', error);
        }
        return serviceData;
    }
};

export const useGetAiInsightsServicesContract = (did: string, upsert?: boolean) => {
    const { initWallet } = useWallet();
    const { currentLCNUser, currentLCNUserLoading } = useGetCurrentLCNUser();

    const [contractUri, setContractUri] = useState<string | null>(null);
    const [contract, setContract] = useState<ConsentFlowContractDetails | null>(null);

    const getAiInsightsContractUri = async () => {
        const wallet = await initWallet();
        const existingContract = await getAiInsightsServices(wallet, did);

        if (existingContract) {
            setContractUri(existingContract.id);

            const contract = await wallet.invoke.getContract(existingContract.id);
            setContract(contract);

            return { contractUri: existingContract.id, contract };
        }

        if (upsert && !existingContract) {
            const uri = await createTeacherStudentContract({
                teacherProfile: currentLCNUser!,
            });
            await createAiInsightsService(wallet, uri, currentLCNUser?.profileId!, did);

            setContractUri(uri);
            const contract = await wallet.invoke.getContract(uri);
            setContract(contract);

            return { contractUri: uri, contract };
        }
    };

    useEffect(() => {
        if (currentLCNUserLoading) return;
        getAiInsightsContractUri();
    }, [currentLCNUserLoading, did]);

    return { contractUri, contract, getAiInsightsContractUri, isLoading: currentLCNUserLoading };
};
