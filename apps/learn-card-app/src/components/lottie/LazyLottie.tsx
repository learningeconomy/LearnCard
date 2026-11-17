import React, { Suspense } from 'react';
import type LottiePlayer from 'react-lottie-player';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

// react-lottie-player bundles lottie-web (~300 KB). Load it the first time an animation renders, not at
// startup. lazyWithRetry, like the app's other lazy components: a stale chunk after a deploy is retried
// once in place, then reloads within the shared budget, instead of failing the first render.
const Lottie = lazyWithRetry(() => import('react-lottie-player'));

type LottieProps = React.ComponentProps<typeof LottiePlayer>;

/** Drop-in for `react-lottie-player`'s default export; renders an empty box of the same style while it loads. */
const LazyLottie: React.FC<LottieProps> = props => (
    <Suspense fallback={<div style={props.style} className={props.className} />}>
        <Lottie {...props} />
    </Suspense>
);

export default LazyLottie;
