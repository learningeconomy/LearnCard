import React, { useLayoutEffect, useState } from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';

const readMode = (value: string | null | undefined): IonMode | undefined =>
    value === 'ios' || value === 'md' ? value : undefined;

/**
 * Ionic's `getIonMode(el)`: the `mode` prop, else the closest ancestor's `mode` attribute (an
 * `AppOverlayModal` or `AppToolbar` with a mode, or `<html>`), else the document mode. The first
 * render uses the document mode; the ancestor's is applied before paint. Like Ionic, which reads
 * it once on load, a later change to the ancestor's attribute isn't picked up.
 */
export const useChromeMode = (
    ref: React.RefObject<HTMLElement | null>,
    modeProp: IonMode | undefined
): IonMode => {
    const [inherited, setInherited] = useState<IonMode | undefined>(undefined);

    useLayoutEffect(() => {
        if (modeProp) return;
        const ancestor = ref.current?.parentElement?.closest('[mode]');
        setInherited(readMode(ancestor?.getAttribute('mode')));
    }, [ref, modeProp]);

    return modeProp ?? inherited ?? getIonMode();
};
