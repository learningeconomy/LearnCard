import React from 'react';
import IssuerSeal from '../svgs/IssuerSeal';

type MeritBadgeProfileImageDisplayProps = {
    imageUrl?: string;
    imageComponent?: React.ReactNode;
    showSeal?: boolean;
    className?: string;
    size?: string;
};

const MeritBadgeProfileImageDisplay: React.FC<MeritBadgeProfileImageDisplayProps> = ({
    imageUrl,
    showSeal = false,
    className = '',
    imageComponent,
    size = 'big',
}) => {
    const imageClassName = `${size === 'big' ? 'h-[60px] w-[60px]' : 'h-[39px] w-[39px]'
        } rounded-full overflow-hidden ${showSeal ? 'absolute border-[2px] border-solid border-grayscale-200' : ''
        }`;
    return (
        <div className={className}>
            {showSeal && (
                <div className="bg-white rounded-full p-[5px]">
                    <IssuerSeal size="58" />
                </div>
            )}

            {imageComponent && <div className={imageClassName}>{imageComponent}</div>}
            {!imageComponent && <img className={imageClassName} src={imageUrl} />}
        </div>
    );
};

export default MeritBadgeProfileImageDisplay;
