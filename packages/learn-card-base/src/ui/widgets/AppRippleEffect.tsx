import React, { useEffect, useRef } from 'react';

import { attachActivatableRipple } from '../controls/tapActivation';
import '../controls/controls.css';
import './widgets.css';

/**
 * App-owned replacement for `IonRippleEffect`: the bounded ink ripple Ionic's tap-click utility
 * drew inside the nearest `.ion-activatable` ancestor (which should be `position: relative;
 * overflow: hidden`). Same timings (100ms press delay, 325ms minimum, 200ms fade-out) in both
 * modes, as Ionic's default `rippleEffect: true` config did.
 */
export const AppRippleEffect: React.FC = () => {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const ripple = ref.current;
        const host = ripple?.parentElement?.closest<HTMLElement>('.ion-activatable');
        if (!ripple || !host) return undefined;
        return attachActivatableRipple(host, ripple);
    }, []);

    return (
        <span
            ref={ref}
            className="app-ripple-effect app-ripple-effect-standalone"
            role="presentation"
        />
    );
};

export default AppRippleEffect;
