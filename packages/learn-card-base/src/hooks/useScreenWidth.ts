import { useCallback, useEffect, useState } from 'react';

/**
 * React hook for keeping track of screen width and re-rendering
 *
 * Use like so:
 *
 * const width = useScreenWidth(); // This will rerender the component when resizing the window
 *
 * if (width <= 991) console.log('Mobile width!');
 * else console.log('Not mobile width');
 *
 * To skip re-rendering on resize, pass true like so:
 * useScreenWidth(doesNotNeedToReRenderOnResize);
 */

export const useScreenWidth = (skip = false): number => {
    const [width, setWidth] = useState(() => window.innerWidth);

    const handleResize = useCallback(() => {
        setWidth(window.innerWidth);
    }, []);

    useEffect(() => {
        if (skip) return;

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [skip, handleResize]);

    return width;
};

export default useScreenWidth;
