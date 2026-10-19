import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';

import { useInAppMessageActions } from './useInAppMessageActions';
import type { MessagePresentationProps } from './presentationTypes';

const AUTO_DISMISS_MS = 5000;

export interface InAppMessageToastProps extends MessagePresentationProps {
    durationMs?: number;
}

export const InAppMessageToast: React.FC<InAppMessageToastProps> = ({
    message,
    onClose,
    onAction,
    durationMs = AUTO_DISMISS_MS,
}) => {
    const shouldReduceMotion = useReducedMotion();
    const { runAction } = useInAppMessageActions();
    const runningRef = useRef(false);
    const completedRef = useRef(false);
    const closeRef = useRef(onClose);
    useLayoutEffect(() => {
        closeRef.current = onClose;
    }, [onClose]);

    // Tapping runs the first non-dismiss action (if any) — a toast can't host
    // buttons, so without this an actionable toast would look interactive but
    // do nothing. capgoUpdate is excluded: it needs a progress surface.
    const primaryAction = message.actions.find(
        a => a.style !== 'dismiss' && a.action.type !== 'capgoUpdate'
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (completedRef.current) return;
            completedRef.current = true;
            closeRef.current('dismissed');
        }, durationMs);

        return () => clearTimeout(timer);
    }, [durationMs]);

    const handleTap = async () => {
        if (runningRef.current || completedRef.current) return;

        runningRef.current = true;
        completedRef.current = true;

        try {
            if (primaryAction) {
                onAction?.({
                    actionIndex: message.actions.indexOf(primaryAction),
                    actionType: primaryAction.action.type,
                });
                await runAction(primaryAction.action);
            }
        } finally {
            runningRef.current = false;
            onClose(
                primaryAction && primaryAction.action.type !== 'dismiss' ? 'action' : 'dismissed'
            );
        }
    };

    const variants: Variants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.9,
            y: shouldReduceMotion ? 0 : -16,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 22, stiffness: 320 },
        },
        exit: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.95,
            y: shouldReduceMotion ? 0 : -12,
            transition: { duration: 0.2 },
        },
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none flex justify-center px-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            aria-live="polite"
        >
            <motion.button
                type="button"
                onClick={handleTap}
                className="pointer-events-auto max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-white/60 px-4 py-3 font-poppins flex items-center gap-3 text-left relative overflow-hidden"
                variants={variants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r/srgb from-transparent via-white to-transparent opacity-80" />

                {message.emoji && (
                    <span className="text-[22px] leading-none shrink-0" aria-hidden="true">
                        {message.emoji}
                    </span>
                )}

                <span className="min-w-0">
                    <span className="block text-sm font-semibold text-grayscale-900 tracking-[-0.01em] truncate">
                        {message.title}
                    </span>

                    {message.body && (
                        <span className="block text-xs text-grayscale-600 leading-relaxed mt-0.5 line-clamp-2">
                            {message.body}
                        </span>
                    )}
                </span>
            </motion.button>
        </div>
    );
};

export default InAppMessageToast;
