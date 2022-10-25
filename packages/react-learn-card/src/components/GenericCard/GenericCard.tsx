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

            <section className="generic-card-title w-full flex justify-center line-clamp-2">
                <p className="text-sm text-grayscale-900 font-bold mt-[10px] text-center">
                    {title}
                </p>
            </section>

            <section className="generic-card-footer"></section>
        </button>
    );
};

export default GenericCard;
