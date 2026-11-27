import { describe, expect, it } from 'vitest';

import { calculateWindowAdjustment, getPopoverPosition, shouldShowArrow } from './popoverPosition';

const click = (clientX: number, clientY: number) => ({ clientX, clientY }) as unknown as Event;
const DEFAULT = { top: -1, left: -1, originX: 'left' as const, originY: 'top' as const };

describe('getPopoverPosition', () => {
    it('places a bottom / start popover just below the pointer', () => {
        const pos = getPopoverPosition(
            false,
            200,
            100,
            0,
            0,
            'event',
            'bottom',
            'start',
            DEFAULT,
            null,
            click(50, 40)
        );
        expect(pos).toMatchObject({ top: 41, left: 50, originX: 'left', originY: 'top' });
    });

    it('end-aligns against the pointer and centers against a trigger', () => {
        const end = getPopoverPosition(
            false,
            200,
            100,
            0,
            0,
            'event',
            'bottom',
            'end',
            DEFAULT,
            null,
            click(300, 40)
        );
        expect(end).toMatchObject({ top: 41, left: 101, originX: 'right' });

        const trigger = {
            getBoundingClientRect: () => ({ top: 10, left: 100, width: 40, height: 20 }),
        } as Element;
        const center = getPopoverPosition(
            false,
            200,
            100,
            20,
            10,
            'trigger',
            'bottom',
            'center',
            DEFAULT,
            trigger
        );
        expect(center).toMatchObject({
            top: 40,
            left: 20,
            arrowTop: 30,
            arrowLeft: 110,
            originX: 'center',
        });
    });

    it('falls back to the default position without an event', () => {
        expect(getPopoverPosition(false, 200, 100, 0, 0, 'event', 'bottom', 'start', DEFAULT)).toBe(
            DEFAULT
        );
    });
});

describe('calculateWindowAdjustment', () => {
    it('clamps to the body padding on either edge', () => {
        const left = calculateWindowAdjustment(
            'bottom',
            50,
            2,
            12,
            400,
            800,
            200,
            100,
            0,
            'left',
            'top'
        );
        expect(left).toMatchObject({ left: 12, checkSafeAreaLeft: true, originX: 'left' });

        const right = calculateWindowAdjustment(
            'bottom',
            50,
            300,
            12,
            400,
            800,
            200,
            100,
            0,
            'left',
            'top'
        );
        expect(right).toMatchObject({ left: 188, checkSafeAreaRight: true, originX: 'right' });
    });

    it('flips a bottom popover above a trigger near the bottom edge', () => {
        const trigger = { top: 760, left: 24, width: 1, height: 1 };
        const flipped = calculateWindowAdjustment(
            'bottom',
            761,
            24,
            12,
            400,
            800,
            200,
            150,
            0,
            'left',
            'top',
            trigger
        );
        expect(flipped).toMatchObject({ top: 611, originY: 'bottom', addPopoverBottomClass: true });
    });

    it('pins to the bottom padding when the popover fits neither above nor below', () => {
        const trigger = { top: 100, left: 24, width: 1, height: 1 };
        const tall = calculateWindowAdjustment(
            'bottom',
            101,
            24,
            12,
            400,
            300,
            200,
            250,
            0,
            'left',
            'top',
            trigger
        );
        expect(tall).toMatchObject({ top: 101, bottom: 12, addPopoverBottomClass: false });
    });
});

describe('shouldShowArrow', () => {
    it('needs an event or trigger, and hides on adjusted side popovers', () => {
        expect(shouldShowArrow('bottom')).toBe(false);
        expect(shouldShowArrow('bottom', true, click(0, 0))).toBe(true);
        expect(shouldShowArrow('left', true, click(0, 0))).toBe(false);
    });
});
