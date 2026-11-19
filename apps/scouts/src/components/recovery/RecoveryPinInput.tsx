import React, { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface RecoveryPinInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    length?: number;
    /** `code` = an emailed one-time code: visible digits and OS code autofill, no password-manager prompts. */
    variant?: 'pin' | 'code';
}

export const RecoveryPinInput: React.FC<RecoveryPinInputProps> = ({
    value,
    onChange,
    onComplete,
    disabled = false,
    error = false,
    length = 6,
    variant = 'pin',
}) => {
    const isCode = variant === 'code';
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState(() => Array.from({ length }, (_, i) => value[i] ?? ''));
    const digitsRef = useRef(digits);
    const emittedValue = useRef(value);
    useEffect(() => {
        if (value !== emittedValue.current || value === '' || digitsRef.current.length !== length) {
            digitsRef.current = Array.from({ length }, (_, i) => value[i] ?? '');
            setDigits(digitsRef.current);
            emittedValue.current = value;
        }
    }, [value, length]);

    const updateDigits = (next: string[]) => {
        digitsRef.current = next;
        setDigits(next);
        emittedValue.current = next.join('');
        onChange(emittedValue.current);
    };

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val && !/^\d+$/.test(val)) return;

        const char = val.slice(-1);

        const newValue = [...digits];
        newValue[index] = char;
        const newPin = newValue.join('');

        updateDigits(newValue);

        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newValue.every(Boolean) && onComplete) {
            onComplete(newPin);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (!digits[index] && index > 0) {
                const newValue = [...digits];
                newValue[index - 1] = '';
                updateDigits(newValue);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newValue = [...digits];
                newValue[index] = '';
                updateDigits(newValue);
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
            updateDigits(Array.from({ length }, (_, i) => pastedData[i] ?? ''));
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        // Boxes shrink to share the row, so an 8-digit code fits a narrow card.
        <div className="flex w-full max-w-md items-center justify-center gap-1.5 sm:gap-2">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => {
                        inputRefs.current[index] = el;
                    }}
                    type={isCode ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    autoComplete={isCode && index === 0 ? 'one-time-code' : 'off'}
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                    value={digits[index] || ''}
                    onFocus={() => {
                        const firstEmpty = digitsRef.current.findIndex(digit => !digit);
                        if (firstEmpty >= 0 && index > firstEmpty) {
                            inputRefs.current[firstEmpty]?.focus();
                        }
                    }}
                    onChange={e => handleChange(index, e)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    aria-label={`${isCode ? 'Code' : 'PIN'} digit ${index + 1}`}
                    className={`flex-1 min-w-0 max-w-12 h-12 sm:h-14 px-0 text-center text-xl font-semibold rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-colors ${
                        error
                            ? 'border-red-300 focus:ring-red-500 focus:border-transparent text-red-900'
                            : 'border-grayscale-300 focus:ring-emerald-500 focus:border-transparent text-grayscale-900'
                    } ${disabled ? 'opacity-50 cursor-not-allowed bg-grayscale-50' : ''}`}
                />
            ))}
        </div>
    );
};
