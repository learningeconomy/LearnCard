import React, { useEffect, useRef } from 'react';

export const useOnMomentumScrollEnd = ({
    onScroll: _onScroll,
    onMomentumScrollEnd,
    debounceTime = 305,
}: {
    onScroll?: React.UIEventHandler;
    onMomentumScrollEnd: React.UIEventHandler;
    debounceTime?: number;
}) => {
    const momentumScrollEndTimer = useRef<NodeJS.Timeout>();

    useEffect(() => () => clearTimeout(momentumScrollEndTimer.current), []);

    const onScroll: React.UIEventHandler = (e) => {
        _onScroll?.(e);

        clearTimeout(momentumScrollEndTimer.current);
        momentumScrollEndTimer.current = setTimeout(() => {
            onMomentumScrollEnd(e);
        }, debounceTime);
    };

    return onScroll;
};

export default useOnMomentumScrollEnd;
