import type { FC, ReactNode } from 'react';

export const DirectionalIcon: FC<{ children: ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <span className={`inline-block rtl:[transform:scaleX(-1)] ${className ?? ''}`}>{children}</span>
);
