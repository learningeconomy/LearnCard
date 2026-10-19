import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { MessageMedia } from './MessageMedia';
import { MessageActions } from './MessageActions';
import type { MessagePresentationProps } from './presentationTypes';
import { useT } from '../i18n';

const isInteractive = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    Boolean(
        target.closest(
            'button,a,input,textarea,select,video,audio,iframe,[role="button"],[data-story-interactive]'
        )
    );

export const getStorySwipeDirection = (
    dx: number,
    dy: number,
    elapsedMs: number
): -1 | 1 | null => {
    const velocity = (Math.abs(dx) / Math.max(1, elapsedMs)) * 1000;
    if (Math.abs(dx) <= Math.abs(dy) || (Math.abs(dx) < 60 && velocity < 500)) return null;
    return dx < 0 ? 1 : -1;
};

/** Screen navigation is bounded and intentionally never advances automatically. */
export const InAppMessageStory: React.FC<
    MessagePresentationProps & { stepIndex?: number; onStepChange?: (index: number) => void }
> = ({ message, onClose, onAction, stepIndex, onStepChange }) => {
    const [localIndex, setLocalIndex] = useState(0);
    const index = stepIndex ?? localIndex;
    const setIndex = onStepChange ?? setLocalIndex;
    const pointer = useRef<{ x: number; y: number; time: number } | null>(null);
    const reducedMotion = useReducedMotion();
    const t = useT();
    const steps = message.steps ?? [];
    const current = Math.min(index, Math.max(0, steps.length - 1));
    const step = steps[current];
    const move = (delta: number): void =>
        setIndex(Math.max(0, Math.min(steps.length - 1, current + delta)));
    if (!step) return null;

    return (
        <div
            className="w-full min-h-full flex flex-col font-poppins bg-white/80 text-grayscale-900"
            onKeyDown={event => {
                if (
                    event.target instanceof Element &&
                    event.target.closest(
                        'input,textarea,select,video,audio,iframe,[data-story-interactive]'
                    )
                )
                    return;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault();
                    move(event.key === 'ArrowLeft' ? -1 : 1);
                }
            }}
        >
            <header className="p-6 flex items-center gap-3">
                <div
                    className="flex flex-1 gap-1.5"
                    role="progressbar"
                    aria-label={t('inAppMessages.progress')}
                    aria-valuemin={1}
                    aria-valuemax={steps.length}
                    aria-valuenow={current + 1}
                >
                    {steps.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1 flex-1 rounded-full ${i <= current ? 'bg-grayscale-900' : 'bg-grayscale-200'}`}
                        />
                    ))}
                </div>
                {message.dismissible && (
                    <button
                        type="button"
                        aria-label={t('common.close')}
                        className="p-2 rounded-[20px] text-grayscale-700"
                        onClick={() => onClose('dismissed', { stepIndex: current })}
                    >
                        <IonIcon icon={closeOutline} />
                    </button>
                )}
            </header>
            <div
                className="flex-1 p-6 text-center touch-pan-y"
                onPointerDown={event => {
                    if (isInteractive(event.target) || event.button !== 0) return;
                    pointer.current = {
                        x: event.clientX,
                        y: event.clientY,
                        time: performance.now(),
                    };
                }}
                onPointerCancel={() => {
                    pointer.current = null;
                }}
                onPointerUp={event => {
                    const start = pointer.current;
                    pointer.current = null;
                    if (!start || isInteractive(event.target)) return;
                    const dx = event.clientX - start.x;
                    const dy = event.clientY - start.y;
                    const direction = getStorySwipeDirection(
                        dx,
                        dy,
                        performance.now() - start.time
                    );
                    if (direction !== null) {
                        move(direction);
                    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                        const rect = event.currentTarget.getBoundingClientRect();
                        move(event.clientX - rect.left < rect.width / 3 ? -1 : 1);
                    }
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={current}
                        initial={{ opacity: reducedMotion ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: reducedMotion ? 1 : 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.15 }}
                        className="space-y-5"
                    >
                        {step.media ? (
                            <div
                                data-story-interactive={
                                    step.media.type === 'youtube' ? '' : undefined
                                }
                            >
                                <MessageMedia media={step.media} />
                            </div>
                        ) : step.emoji ? (
                            <span aria-hidden="true" className="text-4xl">
                                {step.emoji}
                            </span>
                        ) : null}
                        <h2 className="text-xl font-semibold" aria-live="polite">
                            {step.title}
                        </h2>
                        {step.body && (
                            <p className="text-sm text-grayscale-600 leading-relaxed whitespace-pre-line">
                                {step.body}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            <footer className="p-6 space-y-3">
                {current > 0 && (
                    <button
                        type="button"
                        onClick={() => move(-1)}
                        className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 w-full"
                    >
                        {t('inAppMessages.previous')}
                    </button>
                )}
                {current < steps.length - 1 ? (
                    <button
                        type="button"
                        onClick={() => move(1)}
                        className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white w-full"
                    >
                        {t('inAppMessages.next')}
                    </button>
                ) : (
                    <MessageActions
                        key={current}
                        actions={step.actions ?? message.actions}
                        stepIndex={current}
                        onClose={onClose}
                        onAction={onAction}
                    />
                )}
            </footer>
        </div>
    );
};
