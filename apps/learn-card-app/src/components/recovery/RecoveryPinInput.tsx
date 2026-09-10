import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react';

interface RecoveryPinInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    length?: number;
}

export const RecoveryPinInput: React.FC<RecoveryPinInputProps> = ({
    value,
    onChange,
    onComplete,
    disabled = false,
    error = false,
    length = 6,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val && !/^\d+$/.test(val)) return;

        const char = val.slice(-1);

        const newValue = value.split('');
        newValue[index] = char;
        const newPin = newValue.join('');

        onChange(newPin);

        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newPin.length === length && onComplete) {
            onComplete(newPin);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                const newValue = value.split('');
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                inputRefs.current[index - 1]?.focus();
            } else {
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (pastedData) {
            onChange(pastedData);
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 sm:gap-3">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => (inputRefs.current[index] = el)}
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={e => handleChange(index, e)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    aria-label={`PIN digit ${index + 1}`}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors ${
                        error
                            ? 'border-red-300 focus:ring-red-500 focus:border-transparent text-red-900'
                            : 'border-grayscale-300 focus:ring-emerald-500 focus:border-transparent text-grayscale-900'
                    } ${disabled ? 'opacity-50 cursor-not-allowed bg-grayscale-50' : ''}`}
                />
            ))}
        </div>
    );
};
