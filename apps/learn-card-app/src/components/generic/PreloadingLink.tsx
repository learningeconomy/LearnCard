import React from 'react';
import { Link, LinkProps, useHistory } from 'react-router-dom';

import { ROUTE_PRELOAD } from '../../Routes';

/**
 * Drop-in replacement for react-router's `<Link>` that awaits the destination
 * chunk's preload before navigating, when the target path has a registered
 * preload in ROUTE_PRELOAD. Keeps the current page mounted during the await
 * so the Suspense fallback never fires for chunk-load delays.
 *
 * Falls back to plain `<Link>` behavior when the target isn't in the preload
 * map, when the user uses a modifier click (open in new tab, etc.), or when
 * an `onClick` handler calls `e.preventDefault()`.
 */
const PreloadingLink: React.FC<LinkProps> = ({ to, onClick, children, ...rest }) => {
    const history = useHistory();

    const path = typeof to === 'string' ? to : null;
    const preload = path ? ROUTE_PRELOAD[path] : undefined;

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;
        if (!preload || !path) return;
        // Don't intercept modifier clicks or non-primary buttons — let the
        // browser handle "open in new tab" etc. naturally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        e.preventDefault();
        await Promise.race([
            preload(),
            new Promise<void>(resolve => setTimeout(resolve, 4000)),
        ]).catch(() => undefined);
        history.push(path);
    };

    return (
        <Link to={to} onClick={handleClick} {...rest}>
            {children}
        </Link>
    );
};

export default PreloadingLink;
