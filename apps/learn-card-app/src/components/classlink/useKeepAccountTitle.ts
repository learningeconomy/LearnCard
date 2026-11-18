import { useSchoolConnection } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';

/**
 * The "keep your account" headline for this ClassLink account: "after school" for a
 * student, a plain "Keep your account" for staff and other adults. Reads the school
 * connection (cached per account); until it answers, or if it fails, the student
 * headline is used. `pending` lets a host hold its slot so the title never swaps.
 */
export const useKeepAccountTitle = (enabled = true): { title: string; pending: boolean } => {
    const connection = useSchoolConnection(enabled);
    const student = connection.data?.isStudent !== false;
    return {
        title: student ? m['classlinkKeepAccount.title']() : m['classlinkKeepAccount.titleLogin'](),
        pending: enabled && connection.isLoading,
    };
};
