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

export const emptyRole: BoostPermissions = {
    role: 'empty',
    canView: true,
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
