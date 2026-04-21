import React from 'react';

import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';
import { type Wages } from 'learn-card-base';
import {
    buildSalaryPipeData,
    getWagesBySalaryType,
    getYearlyWages,
} from './ai-pathway-careers.helpers';

const MEDIAN_BUCKET = 4;

const formatSalary = (value: string | number, salaryType: 'per_year' | 'per_hour'): string => {
    const numericValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isFinite(numericValue)) {
        return '$0';
    }

    return `$${new Intl.NumberFormat('en-US', {
        minimumFractionDigits: salaryType === 'per_hour' ? 0 : 0,
        maximumFractionDigits: salaryType === 'per_hour' ? 2 : 0,
    }).format(numericValue)}`;
};

export const AiPathwayCareerPipeChart: React.FC<{
    wages: Wages;
    showMedianOverlay?: boolean;
    salaryType?: 'per_year' | 'per_hour';
}> = ({ wages, showMedianOverlay = true, salaryType = 'per_year' }) => {
    const { NationalWagesList = [] } = wages;
    const selectedWages =
        salaryType === 'per_hour'
            ? getWagesBySalaryType(NationalWagesList, 'per_hour')
            : getYearlyWages(NationalWagesList);

    if (!selectedWages) return null;

    const data = buildSalaryPipeData(selectedWages);


    const minSalary = selectedWages?.Pct10 ?? 0;
    const medianSalary = selectedWages?.Median ?? 0;
    const maxSalary = selectedWages?.Pct90 ?? 0;

    return (
        <div className="w-full relative">
            {showMedianOverlay && (
                <div className="absolute top-[8px] left-[50%] transform translate-x-[-50%] flex items-center gap-[6px] text-[14px] text-grayscale-600">
                    <span className="w-[6px] h-[6px] rounded-full bg-grayscale-900" />
                    <span>Median: {formatSalary(medianSalary, salaryType)}</span>
                </div>
            )}

            {/* Chart */}
            <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap="20%"
                        margin={{ top: showMedianOverlay ? 40 : 12, left: 8, right: 8, bottom: 8 }}
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
                <span>{formatSalary(minSalary, salaryType)}</span>
                <span>{formatSalary(maxSalary, salaryType)}</span>
            </div>
        </div>
    );
};

export default AiPathwayCareerPipeChart;
