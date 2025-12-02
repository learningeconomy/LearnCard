import React, { useEffect, type RefObject } from 'react';

export const useScrollBorders = <Ref extends HTMLElement>({
    ref,
    topShowClassName = 'border-t border-t-[--color-grayscale-line]',
    topHideClassName = 'border-t border-t-transparent',
    bottomShowClassName = 'border-b border-b-[--color-grayscale-line]',
    bottomHideClassName = 'border-b border-b-transparent',
}: {
    ref?: RefObject<Ref>;
    topShowClassName?: string;
    topHideClassName?: string;
    bottomShowClassName?: string;
    bottomHideClassName?: string;
} = {}) => {
    const internalRef = ref ?? React.createRef<Ref>();

    const updateBorderClasses = () => {
        if (
            !internalRef.current ||
            internalRef.current.scrollHeight <= internalRef.current.clientHeight
        )
            return;

        // Top border
        if (internalRef.current.scrollTop > 0) {
            internalRef.current.classList.remove(...topHideClassName.split(' '));
            internalRef.current.classList.add(...topShowClassName.split(' '));
        } else {
            internalRef.current.classList.remove(...topShowClassName.split(' '));
            internalRef.current.classList.add(...topHideClassName.split(' '));
        }

        // Bottom border
        if (
            internalRef.current.scrollTop <
            internalRef.current.scrollHeight - internalRef.current.clientHeight
        ) {
            internalRef.current.classList.remove(...bottomHideClassName.split(' '));
            internalRef.current.classList.add(...bottomShowClassName.split(' '));
        } else {
            internalRef.current.classList.remove(...bottomShowClassName.split(' '));
            internalRef.current.classList.add(...bottomHideClassName.split(' '));
        }
    };

    useEffect(() => {
        const element = internalRef.current;
        if (element) {
            updateBorderClasses();

            element.addEventListener('scroll', updateBorderClasses);

            return () => element.removeEventListener('scroll', updateBorderClasses);
        }
    }, [internalRef]); // Re-run when ref changes

    return internalRef;
};
