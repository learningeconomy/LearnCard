import React, { useCallback, useEffect, useRef, useState } from 'react';

import useModal from './useModal';
import { useSafeArea } from '../../hooks/useSafeArea';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

const DRAG_CLOSE_THRESHOLD = 96;

const BottomSheetModal: ModalContainer = ({ component, options, open }) => {
    const { closeModal } = useModal();
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef<number | null>(null);
    const dragOffsetRef = useRef(0);
    const { bottom: safeAreaBottom } = useSafeArea();

    const optionalClass = options?.className || '';
    const sectionClass = options?.sectionClassName || '';

    const handleCloseModal = useCallback(() => {
        if (options?.disableCloseHandlers) return;

        options?.onClose?.();
        closeModal();
    }, [closeModal, options]);

    const stopDragging = useCallback(
        (shouldClose: boolean) => {
            setIsDragging(false);
            setDragOffset(0);
            dragOffsetRef.current = 0;
            startYRef.current = null;

            if (shouldClose) {
                handleCloseModal();
            }
        },
        [handleCloseModal]
    );

    useEffect(() => {
        if (!isDragging) {
            return undefined;
        }

        const handlePointerMove = (event: PointerEvent) => {
            if (startYRef.current === null) {
                return;
            }

            const nextOffset = Math.max(0, event.clientY - startYRef.current);
            dragOffsetRef.current = nextOffset;
            setDragOffset(nextOffset);
        };

        const handlePointerUp = () => {
            const shouldClose = dragOffsetRef.current >= DRAG_CLOSE_THRESHOLD;
            stopDragging(shouldClose);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [isDragging, stopDragging]);

    const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
        if (options?.disableCloseHandlers) return;

        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }

        startYRef.current = event.clientY;
        dragOffsetRef.current = 0;
        setDragOffset(0);
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    return (
        <aside
            id="cancel-modal"
            className={`bottom-sheet-modal ${optionalClass} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
            style={{
                paddingBottom: `${safeAreaBottom + 12}px`,
            }}
        >
            {!options?.hideDimmer && (
                <button
                    className="center-modal-dimmer"
                    type="button"
                    onClick={handleCloseModal}
                    aria-label="modal-dimmer"
                    aria-hidden
                />
            )}

            <section
                className={`bottom-sheet-modal-section ${optionalClass} ${
                    options?.widen ? 'widen' : ''
                } ${options?.addShadow ? 'add-shadow' : ''} ${sectionClass}`}
                style={
                    isDragging
                        ? {
                              transform: `translateY(${dragOffset}px)`,
                              transition: 'none',
                          }
                        : undefined
                }
            >
                <div className="bottom-sheet-modal-handle-wrap">
                    <div
                        className="bottom-sheet-modal-handle"
                        onPointerDown={handleDragStart}
                        aria-label="Drag to close"
                        role="presentation"
                    >
                        <span className="bottom-sheet-modal-handle-bar" />
                    </div>
                </div>

                <div className="bottom-sheet-modal-content">
                    <GenericErrorBoundary>{component}</GenericErrorBoundary>
                </div>
            </section>
        </aside>
    );
};

export default BottomSheetModal;
