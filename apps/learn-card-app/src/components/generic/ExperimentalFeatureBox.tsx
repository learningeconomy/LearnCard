import React from 'react';
import ExperimentalAtomIcon from '../svgs/ExperimentalAtomIcon';

type ExperimentalFeatureBoxProps = { className?: string };

const ExperimentalFeatureBox: React.FC<ExperimentalFeatureBoxProps> = ({ className = '' }) => {
    return (
        <div
            className={`w-full flex gap-[5px] rounded-[10px] p-[10px] bg-indigo-50 justify-center ${className}`}
        >
            <ExperimentalAtomIcon className="shrink-0" />
            <div className="flex flex-col">
                <p className="text-[18px] text-indigo-600 font-poppins font-[600]">
                    Experimental Feature
                </p>
                <p className="text-[12px] text-indigo-500 font-poppins">
                    You may encounter bugs or issues.
                </p>
            </div>
        </div>
    );
};

export default ExperimentalFeatureBox;
