/**
 * Popover placement, ported from @ionic/core 8.7.2 `components/popover/utils.ts`
 * (`getPopoverPosition`, `calculateWindowAdjustment`, `shouldShowArrow`).
 */
export type PopoverSide = 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
export type PopoverAlign = 'start' | 'center' | 'end';
export type PopoverReference = 'event' | 'trigger';
export type OriginX = 'left' | 'center' | 'right';
export type OriginY = 'top' | 'center' | 'bottom';

type Box = { top: number; left: number; width: number; height: number };

export type PopoverPosition = {
    top: number;
    left: number;
    referenceCoordinates?: Box;
    arrowTop?: number;
    arrowLeft?: number;
    originX: OriginX;
    originY: OriginY;
};

const sideCoordinates = (
    side: PopoverSide,
    ref: Box,
    contentWidth: number,
    contentHeight: number,
    arrowWidth: number,
    arrowHeight: number,
    isRTL: boolean
): { top: number; left: number } => {
    const sideLeft = { top: ref.top, left: ref.left - contentWidth - arrowWidth };
    const sideRight = { top: ref.top, left: ref.left + ref.width + arrowWidth };
    switch (side) {
        case 'top':
            return { top: ref.top - contentHeight - arrowHeight, left: ref.left };
        case 'right':
            return sideRight;
        case 'bottom':
            return { top: ref.top + ref.height + arrowHeight, left: ref.left };
        case 'left':
            return sideLeft;
        case 'start':
            return isRTL ? sideRight : sideLeft;
        case 'end':
            return isRTL ? sideLeft : sideRight;
    }
};

const isHorizontalSide = (side: PopoverSide): boolean =>
    side === 'start' || side === 'end' || side === 'left' || side === 'right';

const alignOffset = (
    align: PopoverAlign,
    side: PopoverSide,
    ref: Box,
    contentWidth: number,
    contentHeight: number
): { top: number; left: number } => {
    if (align === 'center') {
        return isHorizontalSide(side)
            ? { top: -(contentHeight / 2 - ref.height / 2), left: 0 }
            : { top: 0, left: -(contentWidth / 2 - ref.width / 2) };
    }
    if (align === 'end') {
        return isHorizontalSide(side)
            ? { top: -(contentHeight - ref.height), left: 0 }
            : { top: 0, left: -(contentWidth - ref.width) };
    }
    return { top: 0, left: 0 };
};

const arrowPosition = (
    side: PopoverSide,
    arrowWidth: number,
    arrowHeight: number,
    top: number,
    left: number,
    contentWidth: number,
    contentHeight: number,
    isRTL: boolean
): { arrowTop: number; arrowLeft: number } => {
    const leftPosition = {
        arrowTop: top + contentHeight / 2 - arrowWidth / 2,
        arrowLeft: left + contentWidth - arrowWidth / 2,
    };
    const rightPosition = {
        arrowTop: top + contentHeight / 2 - arrowWidth / 2,
        arrowLeft: left - arrowWidth * 1.5,
    };
    switch (side) {
        case 'top':
            return {
                arrowTop: top + contentHeight,
                arrowLeft: left + contentWidth / 2 - arrowWidth / 2,
            };
        case 'bottom':
            return {
                arrowTop: top - arrowHeight,
                arrowLeft: left + contentWidth / 2 - arrowWidth / 2,
            };
        case 'left':
            return leftPosition;
        case 'right':
            return rightPosition;
        case 'start':
            return isRTL ? rightPosition : leftPosition;
        case 'end':
            return isRTL ? leftPosition : rightPosition;
    }
};

const xOrigin = (align: PopoverAlign): OriginX =>
    align === 'start' ? 'left' : align === 'center' ? 'center' : 'right';
const yOrigin = (align: PopoverAlign): OriginY =>
    align === 'start' ? 'top' : align === 'center' ? 'center' : 'bottom';

const origin = (
    side: PopoverSide,
    align: PopoverAlign,
    isRTL: boolean
): { originX: OriginX; originY: OriginY } => {
    switch (side) {
        case 'top':
            return { originX: xOrigin(align), originY: 'bottom' };
        case 'bottom':
            return { originX: xOrigin(align), originY: 'top' };
        case 'left':
            return { originX: 'right', originY: yOrigin(align) };
        case 'right':
            return { originX: 'left', originY: yOrigin(align) };
        case 'start':
            return { originX: isRTL ? 'left' : 'right', originY: yOrigin(align) };
        case 'end':
            return { originX: isRTL ? 'right' : 'left', originY: yOrigin(align) };
    }
};

export const getPopoverPosition = (
    isRTL: boolean,
    contentWidth: number,
    contentHeight: number,
    arrowWidth: number,
    arrowHeight: number,
    reference: PopoverReference,
    side: PopoverSide,
    align: PopoverAlign,
    defaultPosition: PopoverPosition,
    triggerEl?: Element | null,
    event?: Event | null
): PopoverPosition => {
    let ref: Box;
    if (reference === 'event') {
        if (!event) return defaultPosition;
        const mouseEv = event as MouseEvent;
        ref = { top: mouseEv.clientY, left: mouseEv.clientX, width: 1, height: 1 };
    } else {
        const actualTriggerEl = triggerEl ?? (event?.target as Element | null | undefined);
        if (!actualTriggerEl) return defaultPosition;
        const box = actualTriggerEl.getBoundingClientRect();
        ref = { top: box.top, left: box.left, width: box.width, height: box.height };
    }
    const coordinates = sideCoordinates(
        side,
        ref,
        contentWidth,
        contentHeight,
        arrowWidth,
        arrowHeight,
        isRTL
    );
    const aligned = alignOffset(align, side, ref, contentWidth, contentHeight);
    const top = coordinates.top + aligned.top;
    const left = coordinates.left + aligned.left;
    const { arrowTop, arrowLeft } = arrowPosition(
        side,
        arrowWidth,
        arrowHeight,
        top,
        left,
        contentWidth,
        contentHeight,
        isRTL
    );
    return {
        top,
        left,
        referenceCoordinates: ref,
        arrowTop,
        arrowLeft,
        ...origin(side, align, isRTL),
    };
};

export type WindowAdjustment = {
    top: number;
    left: number;
    bottom?: number;
    originX: OriginX;
    originY: OriginY;
    checkSafeAreaLeft: boolean;
    checkSafeAreaRight: boolean;
    arrowTop: number;
    arrowLeft: number;
    addPopoverBottomClass: boolean;
};

/** Keeps the popover inside the viewport, flipping a top/bottom popover that does not fit. */
export const calculateWindowAdjustment = (
    side: PopoverSide,
    coordTop: number,
    coordLeft: number,
    bodyPadding: number,
    bodyWidth: number,
    bodyHeight: number,
    contentWidth: number,
    contentHeight: number,
    safeAreaMargin: number,
    contentOriginX: OriginX,
    contentOriginY: OriginY,
    triggerCoordinates?: Box,
    coordArrowTop = 0,
    coordArrowLeft = 0,
    arrowHeight = 0
): WindowAdjustment => {
    let arrowTop = coordArrowTop;
    const arrowLeft = coordArrowLeft;
    let left = coordLeft;
    let top = coordTop;
    let bottom: number | undefined;
    let originX = contentOriginX;
    let originY = contentOriginY;
    let checkSafeAreaLeft = false;
    let checkSafeAreaRight = false;
    const triggerTop = triggerCoordinates
        ? triggerCoordinates.top + triggerCoordinates.height
        : bodyHeight / 2 - contentHeight / 2;
    const triggerHeight = triggerCoordinates ? triggerCoordinates.height : 0;
    let addPopoverBottomClass = false;
    if (left < bodyPadding + safeAreaMargin) {
        left = bodyPadding;
        checkSafeAreaLeft = true;
        originX = 'left';
    } else if (contentWidth + bodyPadding + left + safeAreaMargin > bodyWidth) {
        checkSafeAreaRight = true;
        left = bodyWidth - contentWidth - bodyPadding;
        originX = 'right';
    }
    if (
        triggerTop + triggerHeight + contentHeight > bodyHeight &&
        (side === 'top' || side === 'bottom')
    ) {
        if (triggerTop - contentHeight > 0) {
            top = Math.max(12, triggerTop - contentHeight - triggerHeight - (arrowHeight - 1));
            arrowTop = top + contentHeight;
            originY = 'bottom';
            addPopoverBottomClass = true;
        } else {
            bottom = bodyPadding;
        }
    }
    return {
        top,
        left,
        bottom,
        originX,
        originY,
        checkSafeAreaLeft,
        checkSafeAreaRight,
        arrowTop,
        arrowLeft,
        addPopoverBottomClass,
    };
};

export const shouldShowArrow = (
    side: PopoverSide,
    didAdjustBounds = false,
    ev?: Event | null,
    trigger?: Element | null
): boolean => {
    if (!ev && !trigger) return false;
    if (side !== 'top' && side !== 'bottom' && didAdjustBounds) return false;
    return true;
};
