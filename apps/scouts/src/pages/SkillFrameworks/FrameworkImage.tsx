import React from 'react';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';

type FrameworkImageProps = {
    image?: string;
    sizeClassName?: string;
    iconSizeClassName?: string;
};

const FrameworkImage: React.FC<FrameworkImageProps> = ({
    image,
    sizeClassName = 'w-[65px] h-[65px]',
    iconSizeClassName = 'w-[30px] h-[30px]',
}) => {
    if (image) {
        return (
            <img
                src={image}
                alt="Framework Thumbnail"
                className={`rounded-full object-cover shrink-0 ${sizeClassName}`}
            />
        );
    } else {
        return (
            <div
                className={`bg-grayscale-900 rounded-full flex items-center justify-center shrink-0 ${sizeClassName}`}
            >
                <SkillsFrameworkIcon className={`${iconSizeClassName}`} version="outlined" />
            </div>
        );
    }
};

export default FrameworkImage;
