import { useEffect } from 'react';

export const useLockBodyScroll = (locked: boolean = true): void => {
    useEffect(() => {
        if (!locked) return;

        const { body, documentElement: html } = document;
        const previousBodyOverflow = body.style.overflow;
        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverscroll = body.style.overscrollBehavior;

        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
        body.style.overscrollBehavior = 'contain';

        return () => {
            body.style.overflow = previousBodyOverflow;
            html.style.overflow = previousHtmlOverflow;
            body.style.overscrollBehavior = previousBodyOverscroll;
        };
    }, [locked]);
};

export default useLockBodyScroll;
