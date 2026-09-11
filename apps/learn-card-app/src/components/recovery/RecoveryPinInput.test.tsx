import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecoveryPinInput } from './RecoveryPinInput';

describe('RecoveryPinInput', () => {
    it('preserves later digits when editing a gap and resets externally', () => {
        const onComplete = vi.fn();
        const Harness = () => {
            const [value, setValue] = React.useState('135790');
            return (
                <>
                    <RecoveryPinInput value={value} onChange={setValue} onComplete={onComplete} />
                    <button onClick={() => setValue('')}>Reset</button>
                </>
            );
        };
        render(<Harness />);
        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.keyDown(inputs[2], { key: 'Backspace' });
        expect(inputs[2]).toHaveValue('');
        expect(inputs[3]).toHaveValue('7');
        expect(onComplete).not.toHaveBeenCalled();
        fireEvent.change(inputs[2], { target: { value: '8' } });
        expect(onComplete).toHaveBeenCalledWith('138790');
        fireEvent.click(screen.getByText('Reset'));
        inputs.forEach(input => expect(input).toHaveValue(''));
    });

    it('focuses the first empty cell and backspaces into the previous cell', () => {
        render(<RecoveryPinInput value="13" onChange={() => {}} />);
        const inputs = screen.getAllByLabelText(/PIN digit/);
        inputs[5].focus();
        expect(inputs[2]).toHaveFocus();
        fireEvent.keyDown(inputs[2], { key: 'Backspace' });
        expect(inputs[1]).toHaveValue('');
        expect(inputs[1]).toHaveFocus();
    });
    it('renders 6 inputs by default', () => {
        render(<RecoveryPinInput value="" onChange={() => {}} />);
        expect(screen.getAllByLabelText(/PIN digit/)).toHaveLength(6);
    });

    it('calls onChange when typing', () => {
        const onChange = vi.fn();
        render(<RecoveryPinInput value="" onChange={onChange} />);
        const firstInput = screen.getByLabelText('PIN digit 1');
        fireEvent.change(firstInput, { target: { value: '1' } });
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('ignores non-numeric input', () => {
        const onChange = vi.fn();
        render(<RecoveryPinInput value="" onChange={onChange} />);
        const firstInput = screen.getByLabelText('PIN digit 1');
        fireEvent.change(firstInput, { target: { value: 'a' } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it('handles backspace', () => {
        const onChange = vi.fn();
        render(<RecoveryPinInput value="12" onChange={onChange} />);
        const secondInput = screen.getByLabelText('PIN digit 2');
        fireEvent.keyDown(secondInput, { key: 'Backspace' });
        expect(onChange).toHaveBeenCalledWith('1');
    });

    it('handles paste', () => {
        const onChange = vi.fn();
        const onComplete = vi.fn();
        render(<RecoveryPinInput value="" onChange={onChange} onComplete={onComplete} />);
        const firstInput = screen.getByLabelText('PIN digit 1');

        const clipboardData = {
            getData: () => '123456',
        };
        fireEvent.paste(firstInput, { clipboardData });

        expect(onChange).toHaveBeenCalledWith('123456');
        expect(onComplete).toHaveBeenCalledWith('123456');
    });

    it('calls onComplete when 6 digits are entered', () => {
        const onChange = vi.fn();
        const onComplete = vi.fn();
        render(<RecoveryPinInput value="12345" onChange={onChange} onComplete={onComplete} />);
        const lastInput = screen.getByLabelText('PIN digit 6');
        fireEvent.change(lastInput, { target: { value: '6' } });
        expect(onChange).toHaveBeenCalledWith('123456');
        expect(onComplete).toHaveBeenCalledWith('123456');
    });
});
