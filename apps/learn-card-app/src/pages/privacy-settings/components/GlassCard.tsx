import React from 'react';

type GlassCardProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
};

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', delay = 0 }) => (
    <section
        className={`bg-white/85 backdrop-blur-xl border border-white/70 ring-1 ring-grayscale-900/[0.06] rounded-[20px] shadow-[0_8px_30px_rgba(24,34,78,0.10)] animate-fade-in-up ${className}`}
        style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
    >
        {children}
    </section>
);

export default GlassCard;
