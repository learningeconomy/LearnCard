import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { MessageMedia } from './MessageMedia';
import { MessageActions } from './MessageActions';
import { useT } from '../i18n';
import type { MessagePresentationProps } from './presentationTypes';

export type InAppMessageModalProps = MessagePresentationProps;

export const InAppMessageModal: React.FC<InAppMessageModalProps> = ({
    message,
    onClose,
    onAction,
}) => {
    const shouldReduceMotion = useReducedMotion();
    const t = useT();

    const hasExplicitDismiss = message.actions.some(a => a.style === 'dismiss');
    const showCloseX = message.dismissible && !hasExplicitDismiss;

    const backdropVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
    };

    const cardVariants: Variants = {
        hidden: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.96,
            y: shouldReduceMotion ? 0 : 12,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 300 },
        },
        exit: {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.96,
            transition: { duration: 0.2 },
        },
    };

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-grayscale-900/40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)] backdrop-blur-md"
            style={{
                paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <motion.div
                className="relative w-full max-w-[480px] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] font-poppins text-center overflow-hidden"
                variants={cardVariants}
            >
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r/srgb from-transparent via-white to-transparent opacity-80" />

                {showCloseX && (
                    <button
                        onClick={() => onClose('dismissed')}
                        className="absolute top-4 right-4 p-2 bg-white/60 backdrop-blur-sm border border-white/60 text-grayscale-400 hover:text-grayscale-900 transition-colors rounded-full hover:bg-white/80 z-10"
                        aria-label={t('common.close')}
                    >
                        <IonIcon icon={closeOutline} className="text-xl block" />
                    </button>
                )}

                <div className="p-6 sm:p-8 space-y-v3-6">
                    {message.media ? (
                        <MessageMedia media={message.media} />
                    ) : message.emoji ? (
                        <div className="mx-auto w-16 h-16 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-xs flex items-center justify-center">
                            <span className="text-[32px] leading-none" aria-hidden="true">
                                {message.emoji}
                            </span>
                        </div>
                    ) : null}

                    <div className="space-y-v3-2 px-2">
                        <h2 className="text-[22px] font-semibold text-grayscale-900 tracking-[-0.01em]">
                            {message.title}
                        </h2>
                        {message.body && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {message.body}
                            </p>
                        )}
                    </div>

                    <MessageActions
                        actions={message.actions}
                        onClose={onClose}
                        onAction={onAction}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default InAppMessageModal;
