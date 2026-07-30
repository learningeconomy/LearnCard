export const DirectionalIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <span className={`inline-block rtl:[transform:scaleX(-1)] ${className ?? ''}`}>{children}</span>
);
