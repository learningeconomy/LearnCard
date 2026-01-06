import React from 'react';
import numeral from 'numeral';

import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import { AiPathwayCareer, getSalaryStats } from './ai-pathway-careers.helpers';

interface AiPathwayCareerPipeChartProps {
    career: AiPathwayCareer;
}

const MEDIAN_BUCKET = 4;

export const AiPathwayCareerPipeChart: React.FC<AiPathwayCareerPipeChartProps> = ({ career }) => {
    const data = career.salaryData;
    const { medianSalary, minSalary, maxSalary } = getSalaryStats(data);

    return (
        <div className="w-full relative">
            {/* Median overlay */}
            <div className="absolute top-[8px] left-[50%] transform translate-x-[-50%] flex items-center gap-[6px] text-[14px] text-grayscale-600">
                <span className="w-[6px] h-[6px] rounded-full bg-grayscale-900" />
                <span>Median: ${numeral(medianSalary).format('0,0')}</span>
            </div>

            {/* Chart */}
            <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap="20%"
                        margin={{ top: 40, left: 8, right: 8, bottom: 8 }}
                    >
                        <XAxis dataKey="bucket" hide />
                        <YAxis hide />

                        <ReferenceLine x={MEDIAN_BUCKET} stroke="#2d2d2d" strokeDasharray="4 4" />

                        <Bar dataKey="value" fill="#9b87e6" radius={[8, 8, 8, 8]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Min / Max labels */}
            <div className="flex justify-between px-[8px] py-[0] mt-[2px] text-[14px] text-grayscale-600">
                <span>${numeral(minSalary).format('0,0')}</span>
                <span>${numeral(maxSalary).format('0,0')}</span>
            </div>
        </div>
    );
};

export default AiPathwayCareerPipeChart;
