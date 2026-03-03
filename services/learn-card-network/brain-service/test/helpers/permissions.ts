import { BoostPermissions } from '@learncard/types';

export const creatorRole: BoostPermissions = {
    role: 'creator',
    canView: true,
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canManageChildrenProfiles: true,
    canViewAnalytics: true,
};

export const adminRole: BoostPermissions = {
    role: 'admin',
    canView: true,
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canManageChildrenProfiles: true,
    canViewAnalytics: true,
};

// @ts-expect-error canView is not required
export const emptyRole: BoostPermissions = {
    role: 'empty',
    canEdit: false,
    canIssue: false,
    canRevoke: false,
    canManagePermissions: false,
    canIssueChildren: '',
    canCreateChildren: '',
    canEditChildren: '',
    canRevokeChildren: '',
    canManageChildrenPermissions: '',
    canManageChildrenProfiles: false,
    canViewAnalytics: false,
};
