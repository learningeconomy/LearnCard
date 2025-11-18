import React from 'react';
import {
    useGetBoostRecipients,
    useResolveBoost,
} from 'learn-card-base/react-query/queries/queries';

export const useGetBoostIssueHistory = (uri: string) => {
    const { data: credential } = useResolveBoost(uri);
    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(uri);

    const issueHistory: {
        id: number;
        name: string;
        thumb: string;
        date: string;
        profileId: string;
    }[] = [];

    if (recipients && recipients?.length > 0) {
        recipients?.forEach((recipient, index) => {
            if (
                !issueHistory?.find(
                    historItem => historItem?.profileId === recipient?.to?.profileId
                )
            ) {
                issueHistory.push({
                    id: index,
                    name: recipient?.to?.displayName ?? recipient?.to?.profileId,
                    thumb: recipient?.to?.image,
                    date: recipient?.received,
                    profileId: recipient?.to?.profileId,
                });
            }
        });
    }

    return { issueHistory, isLoading: recipientsLoading };
};

export default useGetBoostIssueHistory;
