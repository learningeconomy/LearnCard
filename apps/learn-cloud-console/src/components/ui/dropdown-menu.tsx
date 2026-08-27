import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div className="relative inline-block text-left" ref={ref}>
            <div onClick={() => setOpen(!open)}>{trigger}</div>
            {open && (
                <div
                    className={cn(
                        'absolute right-0 top-full mt-2 z-50 min-w-[11rem] w-max overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
                        className
                    )}
                >
                    {React.Children.map(children, child => {
                        if (
                            React.isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(child)
                        ) {
                            return React.cloneElement(child, {
                                onClick: (e: React.MouseEvent) => {
                                    child.props.onClick?.(e);
                                    setOpen(false);
                                },
                            });
                        }
                        return child;
                    })}
                </div>
            )}
        </div>
    );
}

export function DropdownMenuItem({
    children,
    className,
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'relative flex cursor-pointer select-none items-center whitespace-nowrap rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted transition-colors',
                className
            )}
        >
            {children}
        </div>
    );
}
