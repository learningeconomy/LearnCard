import React from 'react';

type BadgeThumbnailImgProps = {
    src: string;
    className?: string;
};

/**
 * Badge thumbnail image with graceful broken-image fallback and a neutral
 * white backing so transparent logos don't pick up the colored badge ring.
 *
 * When `src` is empty or the image fails to load (404 / decode error), a
 * neutral medal/badge glyph placeholder is rendered instead of the browser's
 * broken-image icon.
 */
const BadgeThumbnailImg: React.FC<BadgeThumbnailImgProps> = ({ src, className = '' }) => {
    const [errored, setErrored] = React.useState(false);

    React.useEffect(() => {
        setErrored(false);
    }, [src]);

    if (!src || errored) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-1/2 h-1/2 text-white"
                    aria-hidden="true"
                    data-testid="badge-thumbnail-placeholder"
                >
                    <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
                    <path
                        d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt="badge thumbnail"
            className={`bg-white ${className}`}
            onError={() => setErrored(true)}
        />
    );
};

export default BadgeThumbnailImg;
