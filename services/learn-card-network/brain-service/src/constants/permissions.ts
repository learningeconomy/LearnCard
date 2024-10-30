import { BoostPermissions } from '@learncard/types';

export const CREATOR_PERMISSIONS: BoostPermissions = {
    role: 'creator',
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canViewAnalytics: true,
};

export const ADMIN_PERMISSIONS: BoostPermissions = {
    role: 'admin',
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canViewAnalytics: true,
};

export const EMPTY_PERMISSIONS: BoostPermissions = {
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
    canViewAnalytics: false,
};

export const QUERYABLE_PERMISSIONS = [
    'canIssueChildren',
    'canCreateChildren',
    'canEditChildren',
    'canRevokeChildren',
    'canManageChildrenPermissions',
];

export const NON_CHILD_PERMISSIONS = ['canIssue', 'canEdit', 'canRevoke', 'canManagePermissions'];

export const CHILD_TO_NON_CHILD_PERMISSION: Record<string, string> = {
    'canIssueChildren': 'canIssue',
    'canCreateChildren': '',
    'canEditChildren': 'canEdit',
    'canRevokeChildren': 'canRevoke',
    'canManageChildrenPermissions': 'canManagePermissions',
};
