import React from 'react';
import CaretRightFilled from '../../assets/images/CaretRightFilled.svg';

type AlignmentsRowProps = {
        url?: string
        name?: string
        framework?: string
};
const AlignmentRow:React.FC<AlignmentsRowProps> = ({ 
    url,
    name,
    framework
 }) => {
    return (
        <div className="flex flex-col gap-[5px] font-poppins text-[12px] bg-[#DBEAFE] rounded-[15px] border-b-[1px] border-grayscale-200 border-solid w-full p-[10px] last:border-0">
                <h1 className="text-blue-800 font-semibold uppercase">{framework}</h1>
                {/* this might need to change to a link depends on how it comes back after the api call */}
                <button className="flex" onClick={() => window.open(url)}>
                    <span className="text-left">{name}</span>
                    <img className="w-[20px] self-end" src={CaretRightFilled} alt="right-caret"/>
                </button>
        </div>
    );
};

export default AlignmentRow;
