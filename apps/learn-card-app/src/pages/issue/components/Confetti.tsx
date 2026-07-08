import React, { useMemo } from 'react';

const COLORS = ['#10B981', '#FBBF24', '#18224E', '#A8ACBD'];
const PIECE_COUNT = 22;

export const Confetti: React.FC = () => {
    const pieces = useMemo(
        () =>
            Array.from({ length: PIECE_COUNT }, (_, i) => ({
                left: Math.random() * 100,
                delay: Math.random() * 250,
                duration: 1300 + Math.random() * 500,
                size: 6 + Math.random() * 6,
                color: COLORS[i % COLORS.length],
                rounded: Math.random() > 0.5,
            })),
        []
    );

    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
        >
            {pieces.map((p, i) => (
                <span
                    key={i}
                    className="absolute top-0 motion-safe:animate-confetti-fall"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.rounded ? '9999px' : '2px',
                        animationDelay: `${p.delay}ms`,
                        animationDuration: `${p.duration}ms`,
                    }}
                />
            ))}
        </div>
    );
};
