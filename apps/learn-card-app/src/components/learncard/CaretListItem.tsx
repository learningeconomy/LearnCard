import React from 'react';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';

type CaretListItemProps = {
    icon: React.ReactNode;
    mainText: string;
    subText?: string;
    caretText?: string;
    onClick?: () => void;
    caretOverride?: React.ReactNode;
    disabled?: boolean;
    ariaBusy?: boolean;
};

const CaretListItem: React.FC<CaretListItemProps> = ({
    icon,
    mainText,
    subText,
    caretText,
    onClick,
    caretOverride,
    disabled = false,
    ariaBusy = false,
}) => {
    const content = (
        <>
            <span aria-hidden="true">{icon}</span>
            <div className="flex flex-col items-baseline">
                <span
                    className={`text-grayscale-900 font-notoSans ${
                        subText ? 'text-[17px]' : 'text-[20px]'
                    }`}
                >
                    {mainText}
                </span>
                {subText && (
                    <span className="font-notoSans text-[14px] font-[500] text-grayscale-600">
                        {subText}
                    </span>
                )}
            </div>
            <div className="flex ml-auto items-center">
                {caretText && (
                    <span className="font-poppins text-[14px] text-grayscale-600">{caretText}</span>
                )}
                {!caretOverride && (
                    <span aria-hidden="true">
                        <SlimCaretRight
                            className="text-grayscale-400 h-[20px] w-[20px]"
                            color="currentColor"
                        />
                    </span>
                )}
                {caretOverride}
            </div>
        </>
    );

    const className = `flex w-full gap-[10px] items-center py-[12px] border-grayscale-200 text-left ${
        disabled ? 'cursor-wait opacity-60' : ''
    }`;

    if (onClick) {
        return (
            <button
                type="button"
                className={className}
                onClick={onClick}
                disabled={disabled}
                aria-busy={ariaBusy || undefined}
            >
                {content}
            </button>
        );
    }

    return <div className={className}>{content}</div>;
};

export default CaretListItem;
