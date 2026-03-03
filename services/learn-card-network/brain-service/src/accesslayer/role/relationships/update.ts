import { BoostPermissions } from '@learncard/types';
import { Boost, BoostInstance, Role } from '@models';
import { createRole } from '../create';

/**
 * Updates (or sets) the defaultPermissions for a boost.
 * This will delete any existing defaultRole relationship and create a new one.
 */
export const updateDefaultPermissionsForBoost = async (
    boost: BoostInstance,
    permissions: BoostPermissions
): Promise<void> => {
    // First, find and delete any existing defaultRole relationship
    const existingDefaultRoles = await boost.findRelationships({
        alias: 'defaultRole',
    });

    // Delete existing defaultRole relationships and their Role nodes
    for (const rel of existingDefaultRoles) {
        const roleId = rel.target.id;

        // Delete the relationship
        await Boost.deleteRelationships({
            alias: 'defaultRole',
            where: { source: { id: boost.id }, target: { id: roleId } },
        });

        // Delete the orphaned Role node
        await Role.delete({ where: { id: roleId } });
    }

    // Create new Role with updated permissions
    const newRole = await createRole(permissions);

    // Relate the new Role to the boost
    await boost.relateTo({ alias: 'defaultRole', where: { id: newRole.id } });
};

/**
 * Removes the defaultPermissions from a boost entirely.
 */
export const removeDefaultPermissionsForBoost = async (boost: BoostInstance): Promise<void> => {
    const existingDefaultRoles = await boost.findRelationships({
        alias: 'defaultRole',
    });

    for (const rel of existingDefaultRoles) {
        const roleId = rel.target.id;

        await Boost.deleteRelationships({
            alias: 'defaultRole',
            where: { source: { id: boost.id }, target: { id: roleId } },
        });

        await Role.delete({ where: { id: roleId } });
    }
};
