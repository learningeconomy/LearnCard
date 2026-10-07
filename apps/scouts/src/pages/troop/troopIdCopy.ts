import * as m from '../../paraglide/messages.js';
import { ScoutsRoleEnum } from '../../stores/troopRole';

export const getTroopIdRoleLabel = (role: ScoutsRoleEnum): string => {
    switch (role) {
        case ScoutsRoleEnum.leader:
            return m['addressBook.troopStatusLeader']();
        case ScoutsRoleEnum.national:
            return m['addressBook.troopStatusNationalAdmin']();
        case ScoutsRoleEnum.global:
            return m['addressBook.troopStatusGlobalAdmin']();
        case ScoutsRoleEnum.scout:
        default:
            return m['addressBook.troopStatusScout']();
    }
};
