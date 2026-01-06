import React from 'react';
import numeral from 'numeral';

const AiPathwayAvgSalaryDisplay: React.FC<{
    medianSalary: number;
    minSalary: number;
    maxSalary: number;
}> = ({ medianSalary, minSalary, maxSalary }) => {
    return (
        <div className="w-full flex flex-col items-center justify-start">
            <div className="w-full flex items-center justify-start">
                <span className="text-base font-semibold gradient-salary">
                    ${numeral(medianSalary).format('0,0')}
                </span>
                <span className="text-grayscale-600 text-sm">/yr </span>
            </div>

            <div className="w-full flex items-center justify-start">
                <p className="text-grayscale-600 text-sm">
                    Avg. Base Salary | Range: ${numeral(minSalary).format('0a')} - $
                    {numeral(maxSalary).format('0a')}
                </p>
            </div>
        </div>
    );
};

export default AiPathwayAvgSalaryDisplay;
