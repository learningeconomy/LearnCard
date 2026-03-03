import React from 'react';
import {
    useGetBoostChildren,
    useGetBoostParents,
    useGetCredentialWithEdits,
    useResolveBoost,
} from 'learn-card-base';
import { getRoleFromCred } from '../helpers/troop.helpers';
import { ScoutsRoleEnum } from '../stores/troopPageStore';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { VC } from '@learncard/types';

interface UseTroopIdsParams {
    credential: VC;
    boostUri: string;
}

export const useTroopIds = ({ credential, boostUri }: UseTroopIdsParams) => {
    const uri = React.useMemo(
        () => boostUri || credential?.boostId,
        [boostUri, credential?.boostId]
    );
    const credRole = React.useMemo(() => getRoleFromCred(credential), [credential]);

    const isScout = credRole === ScoutsRoleEnum.scout;
    const isLeader = credRole === ScoutsRoleEnum.leader;

    const { data: boostChildren } = useGetBoostChildren(uri, 1, {
        // this is only ever used to get the scoutUri, so it's alright to filter like this here
        //    have to do this since these results are paginated
        //    without it, if a troop has a bunch of boosts/badges then we won't find the actual scout boost
        type: AchievementTypes.ScoutMember,
    });
    const { data: boostParents } = useGetBoostParents(uri);

    const [troopBoostUri, scoutBoostUri] = React.useMemo(() => {
        let troopUri = '';
        let scoutUri = '';

        if (isLeader) {
            troopUri = uri;
            scoutUri =
                boostChildren?.records.find(b => b.type === AchievementTypes.ScoutMember)?.uri ||
                '';
        } else if (isScout) {
            troopUri =
                boostParents?.records.find(b => b.type === AchievementTypes.Troop)?.uri || '';
            scoutUri = uri;
        }

        return [troopUri, scoutUri];
    }, [isLeader, isScout, uri, boostChildren?.records, boostParents?.records]);

    const { data: scoutId } = useResolveBoost(scoutBoostUri);
    const { data: troopId } = useResolveBoost(troopBoostUri);

    const { credentialWithEdits: troopIdWithEdits } = useGetCredentialWithEdits(
        troopId,
        troopBoostUri
    );
    const { credentialWithEdits: scoutIdWithEdits } = useGetCredentialWithEdits(
        scoutId,
        scoutBoostUri
    );

    return React.useMemo(
        () => ({
            scoutBoostUri,
            troopBoostUri,
            scoutId: scoutIdWithEdits ?? scoutId ?? null,
            troopId: troopIdWithEdits ?? troopId ?? null,
            currentBoostUri: uri,
        }),
        [scoutBoostUri, troopBoostUri, scoutIdWithEdits, scoutId, troopIdWithEdits, troopId, uri]
    );
};

export default useTroopIds;
