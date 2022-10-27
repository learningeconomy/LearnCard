import React from 'react';
import { GenericCardProps } from '../../types';
import { RoundedPill } from '../RoundedPill';
import { Trophy } from '../svgs';

export const GenericCard: React.FC<GenericCardProps> = ({
    title = 'Title Lorem Ipsum',
    thumbImgSrc,
    onClick = () => {},
}) => {
    const thumbClass = thumbImgSrc ? 'bg-grayscale-50' : 'bg-indigo-200';
    return (
        <button
            onClick={onClick}
            className={`generic-display-card-simple bg-white flex flex-col overflow-hidden shadow-[0_0_8px_0px_rgba(0,0,0,0.2)] relative $ py-[0px] px-[0px] w-[160px] h-[209px] rounded-[20px] rounded-square-card-container`}
        >
            <section className="flex generic-card-title w-full flex justify-center items-center  h-[76px]  bg-grayscale-900">
                <p className="text-[14px] font-bold mt-[10px] text-center text-white line-clamp-2">
                    {title}
                </p>
            </section>
            <section
                className={`flex h-[110px] m-auto ${thumbClass} w-[140px] overflow-hidden p-[15px] flex-col justify-center items-center w-full rounded-[20px]`}
            >
                {thumbImgSrc && (
                    <img
                        className="generic-display-card-img h-full w-full object-contain overflow-hidden"
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

            <section className="generic-card-footer"></section>
        </button>
    );
};

export default GenericCard;
