import React, { useCallback, useEffect, useRef, useState } from 'react';

import useModal from './useModal';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import AppModal from './surfaces/AppModal';

const DRAG_CLOSE_THRESHOLD = 96;

const BottomSheetModal: ModalContainer = ({ component, options, open }) => {
    const { requestCloseModal } = useModal();
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef<number | null>(null);
    const dragOffsetRef = useRef(0);

    const optionalClass = options?.className || '';
    const sectionClass = options?.sectionClassName || '';

    const handleCloseModal = useCallback(() => {
        if (options?.disableCloseHandlers) return;

        void requestCloseModal();
    }, [options?.disableCloseHandlers, requestCloseModal]);

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

    // The bottom inset is owned by `.lc-surface--bottom-sheet` (padding on the
    // white sheet), so only the drag transform remains inline.
    const sectionStyle: React.CSSProperties | undefined = isDragging
        ? {
              transform: `translateY(${dragOffset}px)`,
              transition: 'none',
          }
        : undefined;

    return (
        <AppModal
            rootId="cancel-modal"
            variant="bottom-sheet"
            open={open}
            onDimmerClick={handleCloseModal}
            hideDimmer
            rootClassName={`bottom-sheet-modal ${optionalClass} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
            sectionClassName={`bottom-sheet-modal-section ${optionalClass} ${
                options?.widen ? 'widen' : ''
            } ${options?.addShadow ? 'add-shadow' : ''} ${sectionClass}`}
            sectionStyle={sectionStyle}
            beforeSection={
                !options?.hideDimmer && (
                    <button
                        className="center-modal-dimmer"
                        type="button"
                        onClick={handleCloseModal}
                        aria-label="modal-dimmer"
                        aria-hidden
                    />
                )
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
        </AppModal>
    );
};

export default BottomSheetModal;
