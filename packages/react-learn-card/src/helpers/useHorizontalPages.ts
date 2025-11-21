import { RefObject, useEffect, useRef, useState } from 'react';

type ScrollTo<T extends Object> = Record<
    keyof T,
    (smooth?: boolean, options?: ScrollIntoViewOptions) => void
>;

type On<T extends Object> = Record<keyof T, boolean>;

type UseHorizontalPages = <
    T extends Record<string, RefObject<Element>> = Record<string, RefObject<Element>>,
    K extends keyof T = keyof T
>(args: {
    /** Object with names as keys and refs as values, with each ref attached to a page */
    refs: T;
    /** Minimum time in between state updates for the on object */
    throttleTime?: number;
    /** Options to pass into IntersectionObserver constructor */
    options?: IntersectionObserverInit;
    /** If set to false, you must manually call observe to start IntersectionObservers */
    observeImmediately?: boolean;
}) => {
    on: Record<K, boolean>;
    scrollTo: Record<K, (smooth?: boolean, options?: ScrollIntoViewOptions) => void>;
    observe: () => void;
    unobserve: () => void;
};

/**
 * React hook for displaying horizontal pages. This works very well in tandem with CSS Scroll Snap
 * for displaying rich interfaces that can be scrolled via swiping left/right or via buttons
 *
 * To use it, pass in an object of named refs (e.g. { test1: ref1, test2: ref2 }) and attach those
 * refs to your pages (e.g. <section><article ref={ref1} /><article ref={ref2} /></section>)
 *
 * With the above set up, you can scroll to any page using scrollTo[nameOfRef] (e.g. scrollTo.test1),
 * and you may also check whether a given page is visible using on[nameOfRef] (e.g. on.test2).
 *
 * Names are generated automatically based upon the refs object you pass in, and on and scrollTo are
 * both fully type safe, meaning your editor should give you accurate autocompletion hints, and
 * should also warn you if you accidentally mistype a name!
 *
 * Example:
 * const Test = () => {
 *   const refs = { page1: useRef<HTMLElement>(null), page2: useRef<HTMLElement>(null) };
 *   const { on, scrollTo } = useHorizontalPages({ refs });
 *
 *   return (
 *       <main>
 *           <header>
 *               <button type="button" onClick={() => on.page1 ? scrollTo.page2 : scrollTo.page1}>
 *               {`Scroll to ${on.page1 ? 'Page 2' : 'Page 1'}`}
 *               </button>
 *           </header>
 *           <section>
 *               <article ref={page1}>
 *               <article ref={page2>}
 *           </section>
 *       </main>
 *   )
 * }
 *
 * If needed, you can also use observe/unobserve to dynamically add/delete pages as well
 */
const useHorizontalPages: UseHorizontalPages = ({
    refs,
    options = {},
    observeImmediately = true,
}) => {
    const [on, setOn] = useState(
        Object.keys(refs).reduce<On<typeof refs>>(
            (acc, name) => ({ ...acc, [name]: false }),
            (<unknown>{}) as On<typeof refs>
        )
    );

    const observer = useRef<Record<string, IntersectionObserver>>({});

    const getObserver = (name: string) => {
        if (observer.current[name] === undefined) {
            observer.current[name] = new IntersectionObserver(
                ([entry]) => setOn(oldOn => ({ ...oldOn, [name]: entry.isIntersecting })),
                { rootMargin: '0px', threshold: 0.1, ...options }
            );
        }

        return observer.current[name];
    };

    const scrollTo = Object.entries(refs).reduce<ScrollTo<typeof refs>>((acc, [name, ref]) => {
        acc[<keyof typeof refs>name] = (
            smooth: boolean = true,
            overrides: ScrollIntoViewOptions = {}
        ) => ref.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', ...overrides });

        return acc;
    }, (<unknown>{}) as ScrollTo<typeof refs>);

    const unobserve = () => {
        Object.keys(refs).forEach(name => {
            getObserver(name).disconnect();
        });
    };

    const observe = () => {
        Object.entries(refs).forEach(([name, ref]) => {
            if (ref.current) getObserver(name).observe(ref.current);
        });
    };

    useEffect(() => {
        unobserve();
        if (observeImmediately) observe();

        return unobserve;
    }, [
        // Placing a raw object in the dependencies array here will cause this effect to constantly
        // re-run (unless you memoize the actual object passed in)
        // To be able to account for a given ref changing (e.g. a page being conditionally rendered),
        // we need to serialize the refs object and convert it to a primitive type that will change
        // when the ref values change
        Object.values(refs)
            .map(ref => !!ref.current)
            .join(),
    ]);

    return { on, scrollTo, observe, unobserve };
};

export default useHorizontalPages;
