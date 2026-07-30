import React from 'react';

type BadgeThumbnailImgProps = {
    src?: string;
    alt?: string;
    className?: string;
    /**
     * Tailwind color class for the placeholder glyph. Defaults to a neutral
     * gray that reads well on light backgrounds; pass e.g. `text-white` when
     * the thumbnail sits on a colored badge circle.
     */
    placeholderClassName?: string;
};

/**
 * Credential/badge thumbnail image with a graceful broken-image fallback.
 *
 * When `src` is empty or the image fails to load (404 / decode error), a
 * neutral medal/badge glyph placeholder is rendered instead of the browser's
 * broken-image icon. A white backing is applied to the image so transparent
 * logos don't pick up whatever sits behind the thumbnail.
 *
 * This is the react-learn-card-local equivalent of learn-card-base's
 * BadgeThumbnailImg (react-learn-card cannot depend on learn-card-base).
 */
const BadgeThumbnailImg: React.FC<BadgeThumbnailImgProps> = ({
    src,
    alt = 'badge thumbnail',
    className = '',
    placeholderClassName = 'text-grayscale-400',
}) => {
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
                    className={`w-1/2 h-1/2 ${placeholderClassName}`}
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
            alt={alt}
            className={`bg-white ${className}`}
            onError={() => setErrored(true)}
        />
    );
};

export default BadgeThumbnailImg;
