import type { SwiperModule } from 'swiper/types';

/**
 * Port of `SwiperDefaults` from @ionic/core 8.7.2: a Swiper module that sets Ionic's slide defaults
 * (the old ion-slides behavior). Values are copied verbatim, including options current Swiper
 * ignores, so swipers that used `SwiperDefaults` keep the same configuration.
 */
export const SwiperDefaults: SwiperModule = ({ swiper, extendParams }) => {
    const params: Record<string, unknown> = {
        effect: undefined,
        direction: 'horizontal',
        initialSlide: 0,
        loop: false,
        parallax: false,
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 300,
        slidesPerColumn: 1,
        slidesPerColumnFill: 'column',
        slidesPerGroup: 1,
        centeredSlides: false,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
        touchEventsTarget: 'container',
        freeMode: false,
        freeModeMomentum: true,
        freeModeMomentumRatio: 1,
        freeModeMomentumBounce: true,
        freeModeMomentumBounceRatio: 1,
        freeModeMomentumVelocityRatio: 1,
        freeModeSticky: false,
        freeModeMinimumVelocity: 0.02,
        autoHeight: false,
        setWrapperSize: false,
        zoom: { maxRatio: 3, minRatio: 1, toggle: false },
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,
        touchStartPreventDefault: false,
        shortSwipes: true,
        longSwipes: true,
        longSwipesRatio: 0.5,
        longSwipesMs: 300,
        followFinger: true,
        threshold: 0,
        touchMoveStopPropagation: true,
        touchReleaseOnEdges: false,
        iOSEdgeSwipeDetection: false,
        iOSEdgeSwipeThreshold: 20,
        resistance: true,
        resistanceRatio: 0.85,
        watchSlidesProgress: false,
        watchSlidesVisibility: false,
        preventClicks: true,
        preventClicksPropagation: true,
        slideToClickedSlide: false,
        loopAdditionalSlides: 0,
        noSwiping: true,
        runCallbacksOnInit: true,
        coverflowEffect: { rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true },
        flipEffect: { slideShadows: true, limitRotation: true },
        cubeEffect: { slideShadows: true, shadow: true, shadowOffset: 20, shadowScale: 0.94 },
        fadeEffect: { crossFade: false },
        a11y: {
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
        },
    };
    if (swiper.pagination)
        params.pagination = { type: 'bullets', clickable: false, hideOnClick: false };
    if (swiper.scrollbar) params.scrollbar = { hide: true };
    extendParams(params);
};
