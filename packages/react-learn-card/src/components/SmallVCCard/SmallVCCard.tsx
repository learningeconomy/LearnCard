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
            className={`flex relative $ py-[15px] px-[15px] w-[170px] h-[170px] rounded-[40px] rounded-square-card-container`}
        >
            <p>{title}</p>
        </button>
    );
};

export default SmallVCCard;
