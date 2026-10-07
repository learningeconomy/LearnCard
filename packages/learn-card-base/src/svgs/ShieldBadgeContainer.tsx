import React from 'react';

type ShieldBadgeContainerProps = React.PropsWithChildren<{
    className?: string;
}>;

/** Renders a shield-shaped background with centered badge content. */
const ShieldBadgeContainer: React.FC<ShieldBadgeContainerProps> = ({
    children,
    className = '',
}) => {
    return (
        <span className={`inline-flex h-10 w-10 ${className}`}>
            <span className="relative flex h-full w-full items-center justify-center">
                <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M20 36.6654C20 36.6654 33.3333 29.9987 33.3333 19.9987V8.33203L20 3.33203L6.66663 8.33203V19.9987C6.66663 29.9987 20 36.6654 20 36.6654Z"
                        fill="white"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span className="relative z-10 flex items-center justify-center">{children}</span>
            </span>
        </span>
    );
};

export default ShieldBadgeContainer;
