import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SelectOption<T extends string = string> = {
    value: T;
    label: string;
    description?: string;
    disabled?: boolean;
};

export function Select<T extends string>({
    value,
    onValueChange,
    options,
    placeholder,
    disabled,
    className,
    'aria-label': ariaLabel,
}: {
    value: T | '';
    onValueChange: (value: T) => void;
    options: SelectOption<T>[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
}): JSX.Element {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const updateRect = () => {
        if (triggerRef.current) {
            setTriggerRect(triggerRef.current.getBoundingClientRect());
        }
    };

    useEffect(() => {
        if (open) {
            updateRect();
            window.addEventListener('resize', updateRect);
            window.addEventListener('scroll', updateRect, true);
            return () => {
                window.removeEventListener('resize', updateRect);
                window.removeEventListener('scroll', updateRect, true);
            };
        }
    }, [open]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                listboxRef.current &&
                !listboxRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!open) {
            if (
                e.key === 'Enter' ||
                e.key === ' ' ||
                e.key === 'ArrowDown' ||
                e.key === 'ArrowUp'
            ) {
                e.preventDefault();
                setOpen(true);
                const selectedIdx = options.findIndex(opt => opt.value === value);
                setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                triggerRef.current?.focus();
                break;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    let next = prev + 1;
                    while (next < options.length && options[next].disabled) next++;
                    return next < options.length ? next : prev;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => {
                    let next = prev - 1;
                    while (next >= 0 && options[next].disabled) next--;
                    return next >= 0 ? next : prev;
                });
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                    const opt = options[highlightedIndex];
                    if (!opt.disabled) {
                        onValueChange(opt.value);
                        setOpen(false);
                        triggerRef.current?.focus();
                    }
                }
                break;
            case 'Tab':
                setOpen(false);
                break;
        }
    };

    const toggleOpen = () => {
        if (disabled) return;
        if (!open) {
            const selectedIdx = options.findIndex(opt => opt.value === value);
            setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
        }
        setOpen(!open);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                className={cn(
                    'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                    className
                )}
            >
                <span className={cn(!selectedOption && 'text-muted-foreground')}>
                    {selectedOption ? selectedOption.label : placeholder || ''}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>

            {open &&
                triggerRect &&
                createPortal(
                    <div
                        ref={listboxRef}
                        role="listbox"
                        className="relative z-[100] max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                        style={{
                            position: 'absolute',
                            top: triggerRect.bottom + 4 + window.scrollY, // mt-1 is 4px
                            left: triggerRect.left + window.scrollX,
                            width: triggerRect.width,
                        }}
                    >
                        <div className="p-1 max-h-96 overflow-y-auto">
                            {options.map((option, index) => {
                                const isSelected = option.value === value;
                                const isHighlighted = index === highlightedIndex;

                                return (
                                    <div
                                        key={option.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        aria-disabled={option.disabled}
                                        onClick={() => {
                                            if (!option.disabled) {
                                                onValueChange(option.value);
                                                setOpen(false);
                                                triggerRef.current?.focus();
                                            }
                                        }}
                                        onMouseEnter={() => {
                                            if (!option.disabled) {
                                                setHighlightedIndex(index);
                                            }
                                        }}
                                        className={cn(
                                            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-muted focus:text-foreground',
                                            option.disabled
                                                ? 'pointer-events-none opacity-50'
                                                : 'hover:bg-muted hover:text-foreground',
                                            isHighlighted &&
                                                !option.disabled &&
                                                'bg-muted text-foreground'
                                        )}
                                    >
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </span>
                                        <div className="flex flex-col">
                                            <span>{option.label}</span>
                                            {option.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}
