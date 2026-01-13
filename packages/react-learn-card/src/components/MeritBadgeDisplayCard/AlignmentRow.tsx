import React from 'react';
import CaretRightFilled from '../../assets/images/CaretRightFilled.svg';

type AlignmentsRowProps = {
    url?: string;
    name?: string;
    framework?: string;
    icon?: string;
    description?: string;
    onClick?: () => void;
    frameworkId?: string;
    targetCode?: string;
};
const AlignmentRow: React.FC<AlignmentsRowProps> = ({
    url,
    name,
    framework,
    icon,
    description,
    onClick,
    frameworkId,
    targetCode,
}) => {
    const handleButtonClick = () => {
        if (onClick) {
            onClick();
        } else if (url && !frameworkId && !targetCode) {
            window.open(url);
        }
    };
    return (
        <div className="flex flex-col gap-[5px] font-poppins text-[12px] bg-[#DBEAFE] rounded-[15px] border-b-[1px] border-grayscale-200 border-solid w-full p-[10px] last:border-0">
            <h1 className="text-blue-800 font-semibold uppercase">{framework}</h1>
            {/* this might need to change to a link depends on how it comes back after the api call */}
            <div className="flex flex-col">
                <button className="flex items-center" onClick={handleButtonClick}>
                    <span className="text-left flex items-center gap-[5px]">
                        {icon && <span className="text-[16px]">{icon}</span>}
                        {name}
                    </span>
                    <img className="ml-auto w-[20px]" src={CaretRightFilled} alt="right-caret" />
                </button>
                {description && <p className="text-grayscale-700 mt-[5px]">{description}</p>}
            </div>
        </div>
    );
};

export default AlignmentRow;
