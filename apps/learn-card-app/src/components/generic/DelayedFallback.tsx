import React, { useEffect, useState } from 'react';

interface Props {
    delayMs?: number;
    children: React.ReactNode;
}

/**
 * Renders nothing for `delayMs`, then `children`. Use as a Suspense fallback
 * to suppress brief loading flashes — the previous page stays on screen until
 * the threshold elapses.
 */
const DelayedFallback: React.FC<Props> = ({ delayMs = 200, children }) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setShow(true), delayMs);
        return () => clearTimeout(t);
    }, [delayMs]);
    return show ? <>{children}</> : null;
};

export default DelayedFallback;
