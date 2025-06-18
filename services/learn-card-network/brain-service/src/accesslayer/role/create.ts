import type { BoostPermissions } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Role, type RoleInstance } from '@models';
import { ADMIN_ROLE_ID, CREATOR_ROLE_ID, EMPTY_ROLE_ID } from 'src/constants/roles';
import {
    ADMIN_PERMISSIONS,
    CREATOR_PERMISSIONS,
    EMPTY_PERMISSIONS,
} from 'src/constants/permissions';

export const createRole = async (_role: Partial<BoostPermissions>): Promise<RoleInstance> => {
    const id = uuid();

    // Default any unsent fields to empty and random UUID for role name if none supplied
    const role = { ...EMPTY_PERMISSIONS, role: uuid(), ..._role };

    return Role.createOne({ id, ...role });
};

export const createCreatorRole = async (): Promise<RoleInstance> => {
    return Role.createOne({ id: CREATOR_ROLE_ID, ...CREATOR_PERMISSIONS });
};

export const createAdminRole = async (): Promise<RoleInstance> => {
    return Role.createOne({ id: ADMIN_ROLE_ID, ...ADMIN_PERMISSIONS });
};

export const createEmptyRole = async (): Promise<RoleInstance> => {
    return Role.createOne({ id: EMPTY_ROLE_ID, ...EMPTY_PERMISSIONS });
};
