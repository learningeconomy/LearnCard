import React from 'react';
import CertificateRibbon from './CertificateRibbon';

type CertificateImageDisplayProps = {
    imageUrl: string;
    className?: string;
    ribbonColor?: string;
};

const BadgePlaceholder: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-1/2 h-1/2 text-grayscale-400"
        aria-hidden="true"
    >
        <circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.75" />
        <path
            d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 6.5 13 8.3l2 .3-1.4 1.4.3 2L12 11l-1.9.9.3-2L9 8.6l2-.3L12 6.5Z"
            fill="currentColor"
        />
    </svg>
);

const CertificateImageDisplay: React.FC<CertificateImageDisplayProps> = ({
    imageUrl,
    className = '',
    ribbonColor = 'amber-500',
}) => {
    const [errored, setErrored] = React.useState(false);

    React.useEffect(() => {
        setErrored(false);
    }, [imageUrl]);

    const showPlaceholder = !imageUrl || errored;

    return (
        <div
            className={`flex items-center justify-center w-[120px] h-[120px] rounded-full border-white border-solid border-4 bg-white z-50 ${className}`}
        >
            <div className="relative w-[75%] h-[75%] flex items-center justify-center rounded-full border-white border-solid border-4 overflow-hidden bg-white">
                {showPlaceholder ? (
                    <BadgePlaceholder />
                ) : (
                    <img
                        src={imageUrl}
                        alt="certificate thumbnail"
                        className="h-full w-full object-cover"
                        onError={() => setErrored(true)}
                    />
                )}
            </div>

            <CertificateRibbon className={`absolute z-[9999] ${ribbonColor} w-[120px] h-[120px]`} />
        </div>
    );
};

export default CertificateImageDisplay;
