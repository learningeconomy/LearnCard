import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export type ScrollBehaviorOpt = 'smooth' | 'instant' | 'auto';

export interface UseStickToBottomOptions {
    /** Distance in px from bottom considered "at bottom". Default 64. */
    threshold?: number;
    /** If provided, observes this ref for size changes instead of the scroll container's firstElementChild. */
    contentRef?: RefObject<HTMLElement | null>;
    /** Skip scroll stickiness entirely (for testing or feature flags). */
    enabled?: boolean;
}

export interface UseStickToBottomResult {
    isAtBottom: boolean;
    scrollToBottom: (behavior?: ScrollBehaviorOpt) => void;
    /** Temporarily disables auto-stick. Returns a disposer that re-enables. */
    pause: () => () => void;
}

/**
 * Intent-aware auto-scroll hook for chat-style scroll containers.
 *
 * Tracks whether the user is near the bottom of a scrollable element. When they
 * are, a `ResizeObserver` on the content snaps the container down on every
 * layout change (streaming tokens, images loading, etc.). If the user scrolls
 * up, sticking is paused until they explicitly scroll back down via
 * `scrollToBottom()`.
 *
 * Call `pause()` to temporarily suppress sticking (e.g. during a "pin user
 * message" smooth-scroll animation). Pauses stack — each call returns a
 * disposer that decrements the counter.
 *
 * @param scrollRef - Ref to the scrollable container element.
 * @param options - Threshold, contentRef override, and enabled flag.
 * @returns `{ isAtBottom, scrollToBottom, pause }`.
 */
export const useStickToBottom = (
    scrollRef: RefObject<HTMLElement | null>,
    options: UseStickToBottomOptions = {}
): UseStickToBottomResult => {
    const threshold = options.threshold ?? 64;
    const contentRef = options.contentRef;
    const enabled = options.enabled ?? true;

    const [isAtBottom, setIsAtBottom] = useState(true);
    const stickEnabledRef = useRef(true);
    const pauseCountRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    // ── Scroll handler ──────────────────────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !enabled) return;

        const onScroll = () => {
            if (rafRef.current !== null) return; // throttle via rAF
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;

                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                const atBottom = distanceFromBottom <= threshold;

                stickEnabledRef.current = atBottom && pauseCountRef.current === 0;
                setIsAtBottom(prev => (prev !== atBottom ? atBottom : prev));
            });
        };

        el.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            el.removeEventListener('scroll', onScroll);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [scrollRef, threshold, enabled]);

    // ── ResizeObserver ──────────────────────────────────────────────────
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !enabled) return;

        const target = contentRef?.current ?? el.firstElementChild;
        if (!target) return;

        const observer = new ResizeObserver(() => {
            if (stickEnabledRef.current && scrollRef.current) {
                // Instant snap — no animation. The scroll event will update
                // isAtBottom naturally.
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        });

        observer.observe(target as Element);

        return () => observer.disconnect();
    }, [scrollRef, contentRef, enabled]);

    // ── scrollToBottom ──────────────────────────────────────────────────
    const scrollToBottom = useCallback(
        (behavior: ScrollBehaviorOpt = 'smooth') => {
            const el = scrollRef.current;
            if (!el) return;
            el.scrollTo({ top: el.scrollHeight, behavior });
            stickEnabledRef.current = true;
            setIsAtBottom(true);
        },
        [scrollRef]
    );

    // ── pause ───────────────────────────────────────────────────────────
    const pause = useCallback(() => {
        pauseCountRef.current += 1;
        stickEnabledRef.current = false;
        let disposed = false;
        return () => {
            if (disposed) return;
            disposed = true;
            pauseCountRef.current = Math.max(0, pauseCountRef.current - 1);
            // Re-evaluate after unpause; actual stick state depends on current scroll position
            if (pauseCountRef.current === 0 && scrollRef.current) {
                const el = scrollRef.current;
                const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
                stickEnabledRef.current = distanceFromBottom <= threshold;
            }
        };
    }, [scrollRef, threshold]);

    return { isAtBottom, scrollToBottom, pause };
};
