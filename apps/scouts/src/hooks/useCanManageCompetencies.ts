import { useGetCurrentUserTroopIdsResolved } from 'learn-card-base';

/** ScoutPass's existing credential-based UI gate. API authorization is separate. */
export const useCanManageCompetencies = (): boolean => {
    const { data, isSuccess } = useGetCurrentUserTroopIdsResolved();

    return isSuccess && data?.isScoutGlobalAdmin === true;
};
