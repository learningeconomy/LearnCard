import { useQuery } from '@tanstack/react-query';

import type { OccupationDetailsResponse } from '../../types/careerOneStop';
import { useWallet } from 'learn-card-base';

const fetchOccupationDetailsForKeyword = async (
    did: string,
    keyword: string
): Promise<OccupationDetailsResponse[]> => {
    const res = await fetch(`http://localhost:3001/insights/occupations?did=${did}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch occupation details');
    }

    return res.json();
};

export const useOccupationDetailsForKeyword = (keyword: string | null) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['occupation-details', keyword],
        queryFn: async () => {
            const wallet = await initWallet();
            const did = wallet?.id?.did();
            if (!keyword) {
                throw new Error('Keyword is required');
            }
            return fetchOccupationDetailsForKeyword(did, keyword);
        },
        enabled: Boolean(keyword),
        staleTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
    });
};
