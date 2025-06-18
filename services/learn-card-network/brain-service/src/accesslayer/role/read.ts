import { Role, type RoleInstance } from '@models';
import { createAdminRole, createCreatorRole, createEmptyRole } from './create';
import { ADMIN_ROLE_ID, CREATOR_ROLE_ID, EMPTY_ROLE_ID } from 'src/constants/roles';

export const getRoleById = async (id: string): Promise<RoleInstance | null> => {
    return Role.findOne({ where: { id } });
};

export const getCreatorRole = async (): Promise<RoleInstance> => {
    const existingRole = await getRoleById(CREATOR_ROLE_ID);

    if (existingRole) return existingRole;

    return createCreatorRole();
};

export const getAdminRole = async (): Promise<RoleInstance> => {
    const existingRole = await getRoleById(ADMIN_ROLE_ID);

    if (existingRole) return existingRole;

    return createAdminRole();
};

export const getEmptyRole = async (): Promise<RoleInstance> => {
    const existingRole = await getRoleById(EMPTY_ROLE_ID);

    if (existingRole) return existingRole;

    return createEmptyRole();
};
