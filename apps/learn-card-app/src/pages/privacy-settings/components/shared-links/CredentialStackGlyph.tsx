import React from 'react';

/** Tiny decorative card stack: one layer per credential, capped at three. */
const CredentialStackGlyph: React.FC<{ count: number }> = ({ count }) => {
    const layers = Math.max(1, Math.min(3, count));
    return (
        <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 14 12"
            className="inline-block h-3 w-3.5 shrink-0 align-[-1px]"
        >
            {Array.from({ length: layers }, (_, index) => {
                const offset = (layers - 1 - index) * 2;
                return (
                    <rect
                        key={index}
                        x={offset}
                        y={4 - offset}
                        width={9}
                        height={7}
                        rx={1.5}
                        className={
                            index === layers - 1
                                ? 'fill-white stroke-current'
                                : 'fill-grayscale-100 stroke-current opacity-60'
                        }
                        strokeWidth={1}
                    />
                );
            })}
        </svg>
    );
};

export default CredentialStackGlyph;
