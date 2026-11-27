import { act } from '@testing-library/react';
import { vi } from 'vitest';

type Observed = { cb: IntersectionObserverCallback; el: Element; observer: IntersectionObserver };

/** jsdom has no IntersectionObserver or Element#scroll; ion-datetime's port waits on the first. */
export const installDatetimeTestEnv = () => {
    const observed: Observed[] = [];
    class FakeIntersectionObserver {
        cb: IntersectionObserverCallback;
        constructor(cb: IntersectionObserverCallback) {
            this.cb = cb;
        }
        observe(el: Element) {
            observed.push({ cb: this.cb, el, observer: this as unknown as IntersectionObserver });
        }
        unobserve() {}
        disconnect() {
            for (let i = observed.length - 1; i >= 0; i--)
                if (observed[i].cb === this.cb) observed.splice(i, 1);
        }
        takeRecords() {
            return [];
        }
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const scroll = vi.fn();
    Element.prototype.scroll = scroll as unknown as Element['scroll'];
    Element.prototype.scrollTo = scroll as unknown as Element['scrollTo'];
    return {
        scroll,
        /** Reports every observed element as on screen (threshold crossed upward). */
        showAll: () =>
            act(() => {
                for (const { cb, el, observer } of [...observed]) {
                    cb(
                        [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
                        observer
                    );
                }
            }),
    };
};
