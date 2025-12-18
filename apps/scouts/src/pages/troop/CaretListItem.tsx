import React from 'react';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';

type CaretListItemProps = {
    icon: React.ReactNode;
    mainText: string;
    subText?: string;
    caretText?: string;
    onClick?: () => void;
    caretOverride?: React.ReactNode;
    borderWanted?: boolean;
};

const CaretListItem: React.FC<CaretListItemProps> = ({
    icon,
    mainText,
    subText,
    caretText,
    onClick,
    caretOverride,
    borderWanted = true,
}) => {
    return (
        <div
            role={onClick ? 'button' : undefined}
            className={`flex gap-[10px] items-center py-[10px] ${
                borderWanted
                    ? 'border-grayscale-200 border-solid border-b-[1px] last:border-b-0'
                    : 'mb-[15px]'
            }`}
            onClick={onClick}
        >
            {icon}
            <div className="flex flex-col items-baseline">
                <span
                    className={`text-grayscale-900 font-notoSans ${
                        subText ? 'text-[17px]' : 'text-[20px]'
                    }`}
                >
                    {mainText}
                </span>
                {subText && (
                    <span className="font-notoSans text-[14px] font-[500] text-grayscale-500">
                        {subText}
                    </span>
                )}
            </div>
            <div className="flex ml-auto items-center">
                {caretText && (
                    <span className="font-poppins text-[14px] text-grayscale-500">{caretText}</span>
                )}
                {!caretOverride && (
                    <SlimCaretRight
                        className="text-grayscale-400 h-[20px] w-[20px]"
                        color="currentColor"
                    />
                )}
                {caretOverride}
            </div>
        </div>
    );
};

export default CaretListItem;
