import React from 'react';
import { SmallVCCardProps } from '../../types';

export const SmallVCCard: React.FC<SmallVCCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    date = 'Apr 20, 2022',
    onClick = () => {},
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[15px] px-[15px] w-[160px] h-[209px] rounded-[20px] rounded-square-card-container`}
        >
            <p>{title}</p>
        </button>
    );
};

export default SmallVCCard;
