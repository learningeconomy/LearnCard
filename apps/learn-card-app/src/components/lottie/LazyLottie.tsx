import React, { Suspense, lazy } from 'react';
import type LottiePlayer from 'react-lottie-player';

// react-lottie-player bundles lottie-web (~300 KB). Load it the first time an animation renders, not at startup.
const Lottie = lazy(() => import('react-lottie-player'));

type LottieProps = React.ComponentProps<typeof LottiePlayer>;

/** Drop-in for `react-lottie-player`'s default export; renders an empty box of the same style while it loads. */
const LazyLottie: React.FC<LottieProps> = props => (
    <Suspense fallback={<div style={props.style} className={props.className} />}>
        <Lottie {...props} />
    </Suspense>
);

export default LazyLottie;
