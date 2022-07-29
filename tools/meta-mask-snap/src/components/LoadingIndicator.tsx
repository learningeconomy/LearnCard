import React from 'react';

import { useIsSnapReady } from '@state/snapState';

const LoadingIndicator: React.FC = () => {
    const isSnapReady = useIsSnapReady();

    if (isSnapReady) return <></>;

    return <section>Loading snap...</section>;
};

export default LoadingIndicator;
