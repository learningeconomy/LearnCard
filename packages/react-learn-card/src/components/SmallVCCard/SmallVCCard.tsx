import React from 'react';
import { SmallVCCardProps } from '../../types';
import { Trophy } from '../svgs';
export const SmallVCCard: React.FC<SmallVCCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    date = 'Apr 20, 2022',
    onClick = () => {},
}) => {
    const thumbClass = thumbImgSrc ? 'bg-grayscale-50' : 'bg-indigo-200';
    return (
        <button
            onClick={onClick}
            className={`flex-col shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[8px] px-[8px] w-[160px] h-[209px] rounded-[20px] rounded-square-card-container`}
        >
            <section
                className={`flex h-[110px] ${thumbClass} flex-col justify-center items-center w-full rounded-[20px]`}
            >
                {thumbImgSrc && (
                    <img
                        className="h-full w-full object-contain"
                        src={thumbImgSrc ?? ''}
                        alt="Credential Achievement Image"
                    />
                )}
                {(!thumbImgSrc || thumbImgSrc === '') && (
                    <Trophy
                        className="achievement-placeholder-trophy flex p-[15px]"
                        color="#ffffff"
                    />
                )}
            </section>

            <section className="achievement-title w-full flex justify-center line-clamp-2">
                <p className="text-sm text-grayscale-900 font-bold mt-[10px] text-center">
                    {title}
                </p>
            </section>
            <p className="achievement-card-date mt-[5px] text-grayscale-500 text-[12px]">{date}</p>
            <section className="achievement-card-footer"></section>
        </button>
    );
};

export default SmallVCCard;
