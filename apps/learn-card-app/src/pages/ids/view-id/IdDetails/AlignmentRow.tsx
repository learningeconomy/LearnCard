import React from 'react';
import CaretRightFilled from 'apps/learn-card-app/src/components/svgs/CaretRightFilled';

type AlignmentsRowProps = {
    url?: string;
    name?: string;
    framework?: string;
};
const AlignmentRow: React.FC<AlignmentsRowProps> = ({ url, name, framework }) => {
    return (
        <div className="flex flex-col gap-[5px] font-poppins text-[12px] bg-[rgb(219,234,254)] rounded-[15px] border-b-[1px] border-grayscale-200 border-solid w-full p-[10px] last:border-0">
            <h1 className="text-grayscale-900 font-semibold uppercase">{framework}</h1>
            {/* this might need to change to a link depends on how it comes back after the api call */}
            <button className="flex items-center justify-between" onClick={() => window.open(url)}>
                <span className="text-left text-grayscale-900">{name}</span>
                <CaretRightFilled />
            </button>
        </div>
    );
};

export default AlignmentRow;
