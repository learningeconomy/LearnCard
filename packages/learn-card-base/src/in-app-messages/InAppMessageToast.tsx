import React, { useEffect } from 'react';
import { InAppMessage } from '@learncard/types';
import { motion, useReducedMotion, Variants } from 'framer-motion';

const AUTO_DISMISS_MS = 5000;

export interface InAppMessageToastProps {
    message: InAppMessage;
    onClose: () => void;
    durationMs?: number;
}

export const InAppMessageToast: React.FC<InAppMessageToastProps> = ({
    message,
    onClose,
    durationMs = AUTO_DISMISS_MS,
}) => {
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const timer = setTimeout(onClose, durationMs);

        return () => clearTimeout(timer);
    }, [onClose, durationMs]);

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
    };

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none flex justify-center px-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
            aria-live="polite"
        >
            <motion.button
                type="button"
                onClick={onClose}
                className="pointer-events-auto max-w-[440px] bg-white/80 backdrop-blur-xl rounded-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-white/60 px-4 py-3 font-poppins flex items-center gap-3 text-left relative overflow-hidden"
                variants={variants}
                initial="hidden"
                animate="visible"
            >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

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
