import { useEffect, useRef, useState } from 'react';

/** Synchronous lock prevents a double click before React commits the disabled state. */
export const useCampaignAction = () => {
    const lock = useRef(false);
    const mounted = useRef(true);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    const run = async (label: string, action: () => Promise<void>) => {
        if (lock.current || !mounted.current) return;
        lock.current = true;
        setBusy(label);
        setError('');
        setSuccess('');
        try {
            await action();
        } catch (error) {
            const code =
                typeof error === 'object' &&
                error !== null &&
                'data' in error &&
                typeof error.data === 'object' &&
                error.data !== null &&
                'code' in error.data
                    ? error.data.code
                    : undefined;
            const notificationTestDisabled =
                code === 'PRECONDITION_FAILED' &&
                typeof error === 'object' &&
                error !== null &&
                'message' in error &&
                error.message ===
                    'Notification tests are disabled by your announcement preferences';
            if (mounted.current)
                setError(
                    code === 'CONFLICT'
                        ? 'Campaign changed since you loaded it. Copy any unsaved edits, then reload the latest version before trying again.'
                        : notificationTestDisabled
                          ? 'No test was sent. Enable inbox and push announcements in Privacy & Data, or deselect In-app & push notification and try again.'
                          : 'Something went wrong. Check your connection and try again. The last request may have completed; refresh before retrying.'
                );
        } finally {
            lock.current = false;
            if (mounted.current) setBusy('');
        }
    };
    return { busy, error, success, setSuccess, run };
};
