import { useGetBoostParents } from 'learn-card-base';
import { getScoutsRole } from '../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../stores/troopPageStore';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { VC } from '@learncard/types';

interface NetworkRecord {
    type: string;
    name: string;
    meta?: {
        edits?: {
            name?: string;
        };
    };
}

interface BoostParentsResponse {
    records?: NetworkRecord[];
}

interface UseGetTroopNetworkProps {
    credential?: VC;
    uri?: string;
}

interface UseGetTroopNetworkResult {
    network?: NetworkRecord;
    isLoading: boolean;
    error?: Error;
}

const NETWORK_TYPES = {
    GLOBAL: AchievementTypes.Global,
    NETWORK: AchievementTypes.Network,
    EXT_NETWORK: 'ext:Network',
} as const;

export const useGetTroopNetwork = ({
    credential,
    uri: providedUri,
}: UseGetTroopNetworkProps): UseGetTroopNetworkResult => {
    const role = getScoutsRole(credential);
    const uri = providedUri ?? credential?.boostId;

    const generationsUp = role === ScoutsRoleEnum.scout ? 2 : 1;
    const shouldFetchParents = role !== ScoutsRoleEnum.global;

    const {
        data: parentBoosts,
        isLoading,
        error,
    } = useGetBoostParents(uri, generationsUp, undefined, shouldFetchParents);

    if (process.env.NODE_ENV !== 'test') {
        try {
            console.log('useGetTroopNetwork::params', {
                uri,
                role,
                generationsUp,
                shouldFetchParents,
            });
            if (parentBoosts) {
                console.log('useGetTroopNetwork::parents', {
                    count: parentBoosts?.records?.length ?? 0,
                    records: parentBoosts?.records?.map(r => ({
                        type: r?.type,
                        name: r?.name,
                        meta: r?.meta,
                    })),
                });
            }
        } catch (e) {
            console.log('useGetTroopNetwork::log_error', e);
        }
    }

    if (!credential) {
        return { network: undefined, isLoading, error };
    }

    const findNetworkByRole = (records?: NetworkRecord[]): NetworkRecord | undefined => {
        if (!records) return undefined;

        return records.find(record => {
            if (role === ScoutsRoleEnum.national) {
                return record.type === NETWORK_TYPES.GLOBAL;
            }
            return (
                record.type === NETWORK_TYPES.NETWORK || record.type === NETWORK_TYPES.EXT_NETWORK
            );
        });
    };

    const network = findNetworkByRole(parentBoosts?.records);

    if (network) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('useGetTroopNetwork::selectedNetwork', {
                type: network?.type,
                name: network?.name,
                meta: network?.meta,
            });
        }
        return {
            network: {
                ...network,
                name: network.meta?.edits?.name || network.name,
            },
            isLoading,
            error,
        };
    }

    if (process.env.NODE_ENV !== 'test') {
        console.log('useGetTroopNetwork::noNetworkFound', {
            role,
            recordsCount: parentBoosts?.records?.length ?? 0,
        });
    }

    return { network: undefined, isLoading, error };
};

export const useTroopNetwork = (props: UseGetTroopNetworkProps): UseGetTroopNetworkResult => {
    const result = useGetTroopNetwork(props);

    if (result.error) {
        console.error('Error fetching troop network:', result.error);
    }

    return result;
};

export default useGetTroopNetwork;
