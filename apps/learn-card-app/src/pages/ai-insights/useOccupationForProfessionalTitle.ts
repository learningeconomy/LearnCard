import { useMemo } from 'react';

import { useOccupationDetailsForKeyword, type OccupationDetailsResponse } from 'learn-card-base';

export type UseOccupationForProfessionalTitleResult = {
    occupation: OccupationDetailsResponse | undefined;
    occupations: OccupationDetailsResponse[];
    isLoading: boolean;
    isFetching: boolean;
};

export const useOccupationForProfessionalTitle = (
    professionalTitle: string
): UseOccupationForProfessionalTitleResult => {
    const trimmedTitle = professionalTitle.trim();
    const { data, isLoading, isFetching } = useOccupationDetailsForKeyword(trimmedTitle);

    const occupations = (data ?? []) as OccupationDetailsResponse[];

    const occupation = useMemo(() => {
        if (!trimmedTitle || occupations.length === 0) {
            return undefined;
        }

        const normalizedTitle = trimmedTitle.toLowerCase();

        return (
            occupations.find(
                result => result?.OnetTitle?.trim().toLowerCase() === normalizedTitle
            ) ?? occupations[0]
        );
    }, [occupations, trimmedTitle]);

    return {
        occupation,
        occupations,
        isLoading,
        isFetching,
    };
};
