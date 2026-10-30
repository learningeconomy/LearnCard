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
        } catch {
            if (mounted.current)
                setError(
                    'Something went wrong. Check your connection and try again. The last request may have completed; refresh before retrying.'
                );
        } finally {
            lock.current = false;
            if (mounted.current) setBusy('');
        }
    };
    return { busy, error, success, setSuccess, run };
};
