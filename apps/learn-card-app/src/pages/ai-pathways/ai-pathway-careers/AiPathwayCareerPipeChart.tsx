import React from 'react';

import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    ReferenceLine,
    Label,
} from 'recharts';
import { type Wages } from 'learn-card-base';
import {
    buildSalaryDistributionData,
    formatAboutCount,
    formatSalaryAmount,
    getSelectedWagesBySalaryType,
} from './ai-pathway-careers.helpers';

const LIGHT_BAR_COLOR = '#DCE4FF';
const DARK_BAR_COLOR = '#5B63F6';

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const normalizedHex = hex.replace('#', '');
    const fullHex =
        normalizedHex.length === 3
            ? normalizedHex
                  .split('')
                  .map(char => char + char)
                  .join('')
            : normalizedHex;

    const numericValue = Number.parseInt(fullHex, 16);

    return {
        r: (numericValue >> 16) & 255,
        g: (numericValue >> 8) & 255,
        b: numericValue & 255,
    };
};

const mixColor = (start: string, end: string, ratio: number): string => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const startRgb = hexToRgb(start);
    const endRgb = hexToRgb(end);

    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * clampedRatio);
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * clampedRatio);
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * clampedRatio);

    return `rgb(${r}, ${g}, ${b})`;
};

type MedianReferenceLabelProps = {
    x?: number;
    y?: number;
    viewBox?: { x: number; y: number; width: number; height: number };
    medianBucketEmploymentCount?: string;
    medianSalary: string;
};

const MedianReferenceLabel: React.FC<MedianReferenceLabelProps> = ({
    x,
    y,
    medianBucketEmploymentCount,
    medianSalary,
    viewBox,
}) => {
    const labelX = typeof x === 'number' ? x : viewBox ? viewBox.x + viewBox.width / 2 : undefined;
    const labelY =
        typeof y === 'number' ? Math.max(2, y - 60) : viewBox ? Math.max(2, viewBox.y - 28) : 2;

    if (typeof labelX !== 'number') {
        return null;
    }

    return (
        <g pointerEvents="none">
            <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="#6F7590"
                style={{ fontFamily: 'Poppins, sans-serif' }}
            >
                <tspan
                    x={labelX}
                    dy="0"
                    fill="#353E64"
                    style={{ fontSize: '14px', fontWeight: 500 }}
                >
                    Median: {medianSalary}
                </tspan>
                {medianBucketEmploymentCount && (
                    <tspan
                        x={labelX}
                        dy="16"
                        fill="#8B91A7"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                    >
                        ~ {medianBucketEmploymentCount} people
                    </tspan>
                )}
            </text>
        </g>
    );
};

export const AiPathwayCareerPipeChart: React.FC<{
    wages: Wages;
    estimatedEmployment?: string | number;
    showMedianOverlay?: boolean;
    salaryType?: 'per_year' | 'per_hour';
}> = ({ wages, estimatedEmployment, showMedianOverlay = true, salaryType = 'per_year' }) => {
    const { NationalWagesList = [] } = wages;
    const selectedWages = getSelectedWagesBySalaryType(NationalWagesList, salaryType);

    if (!selectedWages) return null;

    const data = buildSalaryDistributionData(selectedWages, estimatedEmployment, salaryType);
    const medianBucket = data.find(bucket => bucket.isMedianBucket);

    const minSalary = selectedWages?.Pct10 ?? 0;
    const medianSalary = selectedWages?.Median ?? 0;
    const maxSalary = selectedWages?.Pct90 ?? 0;
    const formattedMedianSalary = formatSalaryAmount(medianSalary, false, salaryType);
    const medianBucketEmploymentCount = medianBucket
        ? formatAboutCount(medianBucket.estimatedPeople)
        : '';

    const formatPeople = (value: number) =>
        new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0,
        }).format(value);

    const maxEstimatedPeople = Math.max(...data.map(bucket => bucket.estimatedPeople), 0);

    const formatTooltipValue = (value: string | number | undefined): [string, string] => {
        const numericValue =
            typeof value === 'number' ? value : Number(String(value ?? 0).replace(/,/g, ''));

        return [
            `${formatPeople(Number.isFinite(numericValue) ? numericValue : 0)} people`,
            'Estimated',
        ];
    };

    return (
        <div className="w-full relative">
            {/* Chart */}
            <div className="w-full h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        barCategoryGap="20%"
                        margin={{ top: showMedianOverlay ? 48 : 12, left: 0, right: 8, bottom: 8 }}
                    >
                        <XAxis dataKey="bucketLabel" hide />
                        <YAxis
                            width={40}
                            tickMargin={8}
                            tickFormatter={value => formatAboutCount(value)}
                            tick={{
                                fill: '#8B91A7',
                                fontSize: 14,
                                fontWeight: 500,
                                fontFamily: 'Poppins, sans-serif',
                            }}
                            axisLine={{ stroke: '#E2E3E9' }}
                            tickLine={{ stroke: '#E2E3E9' }}
                        />

                        {medianBucket && showMedianOverlay && (
                            <ReferenceLine
                                x={medianBucket.bucketLabel}
                                stroke="#2d2d2d"
                                strokeDasharray="4 4"
                                label={
                                    showMedianOverlay ? (
                                        <Label
                                            position="top"
                                            offset={48}
                                            content={labelProps => (
                                                <MedianReferenceLabel
                                                    {...labelProps}
                                                    medianBucketEmploymentCount={
                                                        medianBucketEmploymentCount
                                                    }
                                                    medianSalary={formattedMedianSalary}
                                                />
                                            )}
                                        />
                                    ) : undefined
                                }
                            />
                        )}

                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            formatter={formatTooltipValue}
                            labelFormatter={label => String(label)}
                            contentStyle={{
                                borderRadius: '16px',
                                border: '1px solid #E2E3E9',
                                boxShadow: '0 12px 24px rgba(24, 34, 78, 0.08)',
                                background: '#FFFFFF',
                                padding: '10px 12px',
                            }}
                        />

                        <Bar dataKey="estimatedPeople" radius={[8, 8, 0, 0]} maxBarSize={44}>
                            {data.map(bucket => (
                                <Cell
                                    key={bucket.bucket}
                                    fill={mixColor(
                                        LIGHT_BAR_COLOR,
                                        DARK_BAR_COLOR,
                                        maxEstimatedPeople > 0
                                            ? bucket.estimatedPeople / maxEstimatedPeople
                                            : 0
                                    )}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Min / Max labels */}
            <div className="flex justify-between px-[8px] py-[0] mt-[2px] text-[14px] leading-[16px] text-grayscale-900">
                <span className="ml-[34px]">
                    {formatSalaryAmount(minSalary, false, salaryType)}
                </span>
                <span>{formatSalaryAmount(maxSalary, false, salaryType)}</span>
            </div>
        </div>
    );
};

export default AiPathwayCareerPipeChart;
