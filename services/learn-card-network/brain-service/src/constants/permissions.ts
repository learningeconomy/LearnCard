import { BoostPermissions } from '@learncard/types';

export const CREATOR_PERMISSIONS: BoostPermissions = {
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

export const ADMIN_PERMISSIONS: BoostPermissions = {
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

export const EMPTY_PERMISSIONS: BoostPermissions = {
    role: 'empty',
    canView: false,
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

export const QUERYABLE_PERMISSIONS = [
    'canIssueChildren',
    'canCreateChildren',
    'canEditChildren',
    'canRevokeChildren',
    'canManageChildrenPermissions',
];

export const NON_CHILD_PERMISSIONS = [
    'canView',
    'canIssue',
    'canEdit',
    'canRevoke',
    'canManagePermissions',
];

export const CHILD_TO_NON_CHILD_PERMISSION: Record<string, string> = {
    'canIssueChildren': 'canIssue',
    'canCreateChildren': '',
    'canEditChildren': 'canEdit',
    'canRevokeChildren': 'canRevoke',
    'canManageChildrenPermissions': 'canManagePermissions',
};
