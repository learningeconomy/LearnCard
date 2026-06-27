import React from 'react';

export type AppGridTileProps = {
    title: string;
    /** ReactNode → rendered inside a gradient tile; string → rendered as an <img> */
    icon: React.ReactNode | string;
    gradientFrom?: string;
    gradientTo?: string;
    onClick: () => void;
};

const AppGridTile: React.FC<AppGridTileProps> = ({
    title,
    icon,
    gradientFrom,
    gradientTo,
    onClick,
}) => {
    const isImage = typeof icon === 'string';

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={title}
            className="flex flex-col items-center gap-[10px] focus:outline-none"
        >
            {isImage ? (
                <img
                    src={icon as string}
                    alt={title}
                    className="size-[100px] rounded-[24px] object-cover border border-[#FBFBFC]"
                    onError={e => {
                        (e.target as HTMLImageElement).src =
                            'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                    }}
                />
            ) : (
                <div
                    className="flex items-center justify-center size-[160px] rounded-[30px] border border-[#FBFBFC]"
                    style={{
                        backgroundImage:
                            gradientFrom && gradientTo
                                ? `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
                                : undefined,
                    }}
                >
                    <div className="size-[100px] flex items-center justify-center">{icon}</div>
                </div>
            )}
            <p className="font-poppins font-semibold text-[16px] text-center text-[#353E64] [word-break:break-word] line-clamp-3 md:line-clamp-2">
                {title}
            </p>
        </button>
    );
};

export default AppGridTile;
