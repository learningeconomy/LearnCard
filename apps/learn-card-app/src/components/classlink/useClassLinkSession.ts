import { useEffect, useState } from 'react';

import { getClassLinkSession } from '../../auth/classlink/classlinkProfileDefaults';

/**
 * Whether this session is a ClassLink sign-in. `null` while unknown (not checked yet, or
 * `enabled` is false), so callers can tell "still checking" apart from "not ClassLink".
 */
export const useClassLinkSession = (enabled: boolean): boolean | null => {
    const [classlink, setClasslink] = useState<boolean | null>(null);

    useEffect(() => {
        if (!enabled) return;
        let live = true;
        void getClassLinkSession().then(session => {
            if (live) setClasslink(session.classlink);
        });
        return () => {
            live = false;
        };
    }, [enabled]);

    return enabled ? classlink : null;
};
