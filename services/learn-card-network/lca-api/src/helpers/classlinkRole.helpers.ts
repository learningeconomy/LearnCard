/**
 * ClassLink role classification (LC-2409). A role is compared trimmed, lowercased and with
 * inner whitespace collapsed, so `' Student'` or `'Tenant  Administrator'` match.
 *
 * Only `student` and the roles in `KNOWN_NON_STUDENT_CLASSLINK_ROLES` are recognized. Any
 * other value (missing, blank, `guest`, a typo, a role we have not seen) is `unknown`, so
 * account continuity fails closed instead of reading it as a non-student.
 */
export type ClassLinkRoleClass = 'student' | 'not_student' | 'unknown';

/**
 * Staff and family roles that are confirmed non-students: the OneRoster roles plus the
 * ClassLink LaunchPad administrator roles. Add a value here only when it is known never to be
 * a student; anything missing fails closed (`status_unknown`) rather than open.
 */
export const KNOWN_NON_STUDENT_CLASSLINK_ROLES: ReadonlySet<string> = new Set([
    'teacher',
    'aide',
    'proctor',
    'staff',
    'administrator',
    'tenant administrator',
    'district administrator',
    'school administrator',
    'site administrator',
    'system administrator',
    'parent',
    'guardian',
    'relative',
]);

export const normalizeClassLinkRole = (role: string | undefined | null): string =>
    (role ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

export const classifyClassLinkRole = (role: string | undefined | null): ClassLinkRoleClass => {
    const normalized = normalizeClassLinkRole(role);
    if (normalized === 'student') return 'student';
    return KNOWN_NON_STUDENT_CLASSLINK_ROLES.has(normalized) ? 'not_student' : 'unknown';
};
