import { useEffect } from 'react';

export const useLockBodyScroll = (locked: boolean = true): void => {
    useEffect(() => {
        if (!locked) return;

        const { body, documentElement: html } = document;

        // The actual scroll container in Ionic + Capacitor isn't `<body>` —
        // it's the inner-scroll element inside `<ion-content>`. Setting
        // `body { overflow: hidden }` is a no-op for the page-level scroll
        // we need to suppress on iOS, so we also drive Ionic's documented
        // `--overflow` CSS var to `hidden` for the duration of the lock.
        const ionContents = Array.from(
            document.querySelectorAll<HTMLElement>('ion-content'),
        );

        const previousBodyOverflow = body.style.overflow;
        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverscroll = body.style.overscrollBehavior;
        const previousIonOverflow = ionContents.map(el =>
            el.style.getPropertyValue('--overflow'),
        );

        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
        body.style.overscrollBehavior = 'contain';
        ionContents.forEach(el => {
            el.style.setProperty('--overflow', 'hidden');
        });

        return () => {
            body.style.overflow = previousBodyOverflow;
            html.style.overflow = previousHtmlOverflow;
            body.style.overscrollBehavior = previousBodyOverscroll;
            ionContents.forEach((el, i) => {
                const prev = previousIonOverflow[i];

                if (prev) {
                    el.style.setProperty('--overflow', prev);
                } else {
                    el.style.removeProperty('--overflow');
                }
            });
        };
    }, [locked]);
};

export default useLockBodyScroll;
