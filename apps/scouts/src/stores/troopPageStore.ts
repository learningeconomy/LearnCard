import { createStore } from '@udecode/zustood';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { VC } from '@learncard/types';

export enum ScoutsRoleEnum {
    scout,
    leader,
    national,
    global,
}

type TroopPageStore = {
    credential: VC | undefined;
    showIdDetails: boolean;
};

const initialState: TroopPageStore = {
    credential: undefined,

    showIdDetails: false,
};

export const troopPageStore = createStore('troopPageStore')<TroopPageStore>(initialState)
    .extendSelectors((set, get) => ({
        uri: () => {
            const credential = get.credential();
            return credential?.boostId ?? '';
        },
        role: () => {
            const credential = get.credential();
            if (!credential) return ScoutsRoleEnum.scout;

            const type =
                credential.credentialSubject?.achievement?.achievementType ||
                credential.boostCredential?.credentialSubject?.achievement?.achievementType;

            switch (type) {
                case AchievementTypes.Global:
                    return ScoutsRoleEnum.global;
                case AchievementTypes.Network:
                case 'ext:Network':
                    return ScoutsRoleEnum.national;
                case AchievementTypes.Troop:
                    return ScoutsRoleEnum.leader;
                case AchievementTypes.ScoutMember:
                    return ScoutsRoleEnum.scout;
                default:
                    console.error(
                        `Failed to map credential type (${type}) to role. Defaulting to scout`
                    );
                    return ScoutsRoleEnum.scout;
            }
        },
    }))
    .extendSelectors((set, get) => ({
        isTroop: () => {
            const role = get.role();
            return role === ScoutsRoleEnum.leader || role === ScoutsRoleEnum.scout;
        },
    }));

export default troopPageStore;
