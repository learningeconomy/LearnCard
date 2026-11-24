import React, { useEffect, useRef, useState } from 'react';

interface Props {
    delayMs?: number;
    /** Called when the delay elapses, just before `children` are shown. */
    onShow?: () => void;
    children: React.ReactNode;
}

/**
 * Renders nothing for `delayMs`, then `children`. Use as a Suspense fallback
 * to suppress brief loading flashes — the previous page stays on screen until
 * the threshold elapses.
 */
const DelayedFallback: React.FC<Props> = ({ delayMs = 200, onShow, children }) => {
    const [show, setShow] = useState(false);
    const onShowRef = useRef(onShow);
    onShowRef.current = onShow;
    useEffect(() => {
        const t = setTimeout(() => {
            onShowRef.current?.();
            setShow(true);
        }, delayMs);
        return () => clearTimeout(t);
    }, [delayMs]);
    return show ? <>{children}</> : null;
};

export default DelayedFallback;
