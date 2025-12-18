import useScreenWidth from './useScreenWidth';

const MOBILE_WIDTH_CUTOFF = 991;

/**
 * React hook for standardized isMobile + isDesktop based on screen width
 *
 * Use like so:
 *
 * const { isMobile, isDesktop } = useDeviceTypeByWidth(); // This will rerender the component when resizing the window
 *
 * if (isMobile) console.log('Mobile width!');
 * else console.log('Not mobile width');
 *
 * To skip re-rendering on resize, pass true like so:
 * useDeviceTypeByWidth(doesNotNeedToReRenderOnResize);
 */
export const useDeviceTypeByWidth = (skip = false) => {
    const width = useScreenWidth(skip);

    const isMobile = width <= MOBILE_WIDTH_CUTOFF;

    return { isMobile, isDesktop: !isMobile };
};

export default useDeviceTypeByWidth;
