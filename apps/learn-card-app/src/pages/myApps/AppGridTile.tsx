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
            className="flex w-full flex-col items-center gap-[10px] focus:outline-none"
        >
            {isImage ? (
                <img
                    src={icon as string}
                    alt={title}
                    className="aspect-square w-full max-w-[100px] rounded-[22%] border border-[#FBFBFC] object-cover"
                    onError={e => {
                        // Clear the handler first so a 404 on the fallback can't loop.
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                    }}
                />
            ) : (
                <div
                    className="flex aspect-square w-full max-w-[160px] items-center justify-center rounded-[19%] border border-[#FBFBFC] p-[18%]"
                    style={{
                        backgroundImage:
                            gradientFrom && gradientTo
                                ? `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
                                : undefined,
                    }}
                >
                    <div className="flex h-full w-full items-center justify-center">{icon}</div>
                </div>
            )}
            <p className="line-clamp-3 text-center font-poppins text-[13px] font-semibold text-[#353E64] [word-break:break-word] sm:text-[14px] md:line-clamp-2 md:text-[16px]">
                {title}
            </p>
        </button>
    );
};

export default AppGridTile;
