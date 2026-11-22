// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

import AccessibleCodeInput from './AccessibleCodeInput';

// Scouts has no Vitest setup file, so register the jest-dom matchers here.
expect.extend(matchers);

type SetupProps = Pick<
    React.ComponentProps<typeof AccessibleCodeInput>,
    'type' | 'errorId' | 'isValid'
>;

const setup = ({ type, errorId, isValid }: SetupProps = {}) => {
    const onChange = vi.fn();
    render(
        <AccessibleCodeInput
            label="Enter code"
            inputMode="numeric"
            fields={6}
            type={type}
            errorId={errorId}
            isValid={isValid}
            onChange={onChange}
            className="react-code-input small"
        />
    );
    const boxes = screen.getAllByLabelText(/digit \d of/) as HTMLInputElement[];
    return { onChange, boxes, values: () => boxes.map(box => box.value) };
};

describe('AccessibleCodeInput', () => {
    it('renders one labelled box per digit inside the styled container', () => {
        const { boxes } = setup({ errorId: 'code-error', isValid: false });

        expect(boxes).toHaveLength(6);
        expect(boxes[0].parentElement).toHaveClass('react-code-input', 'small');
        boxes.forEach((box, index) => {
            expect(box).toHaveAccessibleName(`Enter code, digit ${index + 1} of 6`);
            expect(box).toHaveAttribute('aria-invalid', 'true');
            expect(box).toHaveAttribute('aria-describedby', 'code-error');
            expect(box).toHaveAttribute('inputmode', 'numeric');
        });
        expect(screen.getByRole('group', { name: 'Enter code' })).toBeInTheDocument();
        expect(boxes[0]).toHaveFocus();
    });

    it('fills one box per typed digit, moves focus forward and reports the joined code', () => {
        const { boxes, onChange, values } = setup();

        '123456'.split('').forEach((digit, index) => {
            fireEvent.change(boxes[index], { target: { value: digit } });
            expect(boxes[Math.min(index + 1, 5)]).toHaveFocus();
        });

        expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
        expect(onChange).toHaveBeenLastCalledWith('123456');
        expect(onChange.mock.calls.map(([value]) => value)).toEqual([
            '1',
            '12',
            '123',
            '1234',
            '12345',
            '123456',
        ]);
    });

    it('replaces the digit in a filled box instead of appending to it', () => {
        const { boxes, onChange, values } = setup();
        fireEvent.change(boxes[0], { target: { value: '1' } });

        fireEvent.change(boxes[0], { target: { value: '17' } });

        expect(values()[0]).toBe('7');
        expect(onChange).toHaveBeenLastCalledWith('7');
    });

    it('spreads a pasted code across the boxes from the focused one', () => {
        const { boxes, onChange, values } = setup();

        fireEvent.paste(boxes[0], { clipboardData: { getData: () => ' 135790 ' } });

        expect(values()).toEqual(['1', '3', '5', '7', '9', '0']);
        expect(onChange).toHaveBeenLastCalledWith('135790');
        expect(boxes[5]).toHaveFocus();
    });

    it('drops pasted characters that do not fit and strips - and .', () => {
        const { boxes, onChange, values } = setup();

        fireEvent.paste(boxes[3], { clipboardData: { getData: () => '9-8.76' } });

        expect(values()).toEqual(['', '', '', '9', '8', '7']);
        expect(onChange).toHaveBeenLastCalledWith('987');
    });

    it('accepts a multi-character change event (OS one-time-code autofill)', () => {
        const { boxes, onChange } = setup();

        fireEvent.change(boxes[0], { target: { value: '246810' } });

        expect(onChange).toHaveBeenLastCalledWith('246810');
    });

    it('backspace clears the focused box and moves focus back', () => {
        const { boxes, onChange, values } = setup();
        fireEvent.paste(boxes[0], { clipboardData: { getData: () => '123456' } });

        fireEvent.keyDown(boxes[5], { key: 'Backspace' });
        expect(values()).toEqual(['1', '2', '3', '4', '5', '']);
        expect(onChange).toHaveBeenLastCalledWith('12345');
        expect(boxes[4]).toHaveFocus();

        fireEvent.keyDown(boxes[4], { key: 'Backspace' });
        expect(onChange).toHaveBeenLastCalledWith('1234');
        expect(boxes[3]).toHaveFocus();
    });

    it('moves between boxes with the arrow keys', () => {
        const { boxes } = setup();
        boxes[2].focus();

        fireEvent.keyDown(boxes[2], { key: 'ArrowLeft' });
        expect(boxes[1]).toHaveFocus();
        fireEvent.keyDown(boxes[1], { key: 'ArrowRight' });
        expect(boxes[2]).toHaveFocus();
    });

    it('keeps only digits for type="number"', () => {
        const { boxes, onChange } = setup({ type: 'number' });
        expect(boxes[0]).toHaveAttribute('type', 'number');

        fireEvent.paste(boxes[0], { clipboardData: { getData: () => '1a2b3c' } });

        expect(onChange).toHaveBeenLastCalledWith('123');
    });
});
