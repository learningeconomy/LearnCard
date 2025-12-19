import { produce } from 'immer';
import sift from 'sift';
import { BoostPermissions } from '@learncard/types';

export const CHILD_TO_NON_CHILD_PERMISSION: Record<string, string> = {
    canIssueChildren: 'canIssue',
    canCreateChildren: '',
    canEditChildren: 'canEdit',
    canRevokeChildren: 'canRevoke',
    canManageChildrenPermissions: 'canManagePermissions',
};

export type NoChildPermissions = Omit<
    BoostPermissions,
    | 'role'
    | 'canEditChildren'
    | 'canIssueChildren'
    | 'canRevokeChildren'
    | 'canManageChildrenPermissions'
    | 'canCreateChildren'
>;

export type PermissionsState = NoChildPermissions & {
    ['Social Badge']: NoChildPermissions;
    ['Merit Badge']: NoChildPermissions;
    ['Troop']: NoChildPermissions;
    ['Network']: NoChildPermissions;

    ['Global Admin ID']: NoChildPermissions;
    ['National Admin ID']: NoChildPermissions;
    ['Leader ID']: NoChildPermissions;
    ['Scout ID']: NoChildPermissions;
};

export const hasPermission = (_query: string, category: string) => {
    if (_query === '') return false;
    if (_query === '*') return true;

    const query = JSON.parse(_query);

    return sift(query)({ category });
};

export const getPermissionsForCategory = (
    permissions: BoostPermissions,
    category: string
): Omit<
    BoostPermissions,
    | 'role'
    | 'canEditChildren'
    | 'canIssueChildren'
    | 'canRevokeChildren'
    | 'canManageChildrenPermissions'
    | 'canCreateChildren'
> => {
    const {
        canViewAnalytics,
        canIssueChildren,
        canRevokeChildren,
        canEditChildren,
        canManageChildrenPermissions,
        canCreateChildren,
    } = permissions;

    return {
        canViewAnalytics,
        canCreate: hasPermission(canCreateChildren, category),
        canEdit: hasPermission(canEditChildren, category),
        canIssue: hasPermission(canIssueChildren, category),
        canRevoke: hasPermission(canRevokeChildren, category),
        canManagePermissions: hasPermission(canManageChildrenPermissions, category),
    };
};

export const convertBoostPermissionsToCategoryPermissions = (
    permissions: BoostPermissions
): PermissionsState => {
    if (!permissions) return {};

    return {
        canViewAnalytics: permissions.canViewAnalytics,
        canManagePermissions: permissions.canManagePermissions,
        canRevoke: permissions.canRevoke,
        canIssue: permissions.canIssue,
        canEdit: permissions.canEdit,
        ['Social Badge']: getPermissionsForCategory(permissions, 'Social Badge'),
        ['Merit Badge']: getPermissionsForCategory(permissions, 'Merit Badge'),
        ['Troop']: getPermissionsForCategory(permissions, 'Troop'),
        ['Scout ID']: getPermissionsForCategory(permissions, 'Scout ID'),
        ['Leader ID']: getPermissionsForCategory(permissions, 'Leader ID'),
        ['Network']: getPermissionsForCategory(permissions, 'Network'),
        ['National Admin ID']: getPermissionsForCategory(permissions, 'National Admin ID'),
        ['Global Admin ID']: getPermissionsForCategory(permissions, 'Global Admin ID'),
    };
};

export const flipPermission = (_query: string, category: string, value: boolean): string => {
    if (_query === '') return value ? JSON.stringify({ $in: [category], $nin: [] }) : '';
    if (_query === '*') return value ? '*' : JSON.stringify({ $in: [], $nin: [category] });

    const newQuery = produce(JSON.parse(_query), (query: { $in?: string[]; $nin?: string[] }) => {
        const { $in = [], $nin = [] } = query;

        if (value) {
            query.$nin = $nin.filter(ninCategory => ninCategory !== category);
            if (!query.$in?.includes(category)) query.$in = [...$in, category];
        } else {
            query.$in = $in.filter(inCategory => inCategory !== category);
            if (!query.$nin?.includes(category)) query.$nin = [...$nin, category];
        }
    });

    return JSON.stringify(newQuery);
};

/** Use this one! */
export const serializeChildPermissions = (
    state: PermissionsState,
    key: keyof BoostPermissions
): string => {
    const nonChildPermission = CHILD_TO_NON_CHILD_PERMISSION[key];

    const query = [
        'Social Badge',
        'Merit Badge',
        'Troop',
        'Leader ID',
        'Network',
        'National Admin ID',
        'Global Admin ID',
    ].reduce(
        (query, category) => {
            const value = (state as any)[category][nonChildPermission] as boolean;

            const { $in, $nin } = query;

            if (value) {
                query.$nin = $nin.filter(ninCategory => ninCategory !== category);
                if (!query.$in?.includes(category)) query.$in = [...$in, category];
            } else {
                query.$in = $in.filter(inCategory => inCategory !== category);
                if (!query.$nin?.includes(category)) query.$nin = [...$nin, category];
            }

            return query;
        },
        { $in: [] as string[], $nin: [] as string[] }
    );

    return JSON.stringify(query);
};

export const serializePermissionsState = (
    state: PermissionsState
): Omit<BoostPermissions, 'role'> => {
    return {
        canViewAnalytics: state.canViewAnalytics,
        canManagePermissions: state.canManagePermissions,
        canRevoke: state.canRevoke,
        canIssue: state.canIssue,
        canEdit: state.canEdit,
        canManageChildrenPermissions: serializeChildPermissions(
            state,
            'canManageChildrenPermissions'
        ),
        canRevokeChildren: serializeChildPermissions(state, 'canRevokeChildren'),
        canIssueChildren: serializeChildPermissions(state, 'canIssueChildren'),
        canEditChildren: serializeChildPermissions(state, 'canEditChildren'),
        canCreateChildren: serializeChildPermissions(state, 'canCreateChildren'),
    };
};

export const childPermissionsToDisplayString = (childPermissions: NoChildPermissions): string => {
    if (!childPermissions) return '';

    const { canEdit, canIssue, canCreate, canManagePermissions, canRevoke } = childPermissions;

    const displayStringArray = [];

    if (canCreate) displayStringArray.push('Create');
    if (canEdit) displayStringArray.push('Edit');
    if (canIssue) displayStringArray.push('Issue');
    if (canRevoke) displayStringArray.push('Revoke');
    if (canManagePermissions) displayStringArray.push('Manage Permissions');

    if (displayStringArray.length === 0) return 'None';
    else return displayStringArray.join(', ');
};
