interface ClampTextProps {
    text?: string | null;
    /** classes applied to the text paragraph */
    className?: string;
    lines?: number;
}

export function ClampText({ text, className = '', lines = 2 }: ClampTextProps) {
    if (!text) return null;

    return (
        <p
            className={className}
            style={{
                display: '-webkit-box',
                WebkitLineClamp: lines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}
        >
            {text}
        </p>
    );
}
