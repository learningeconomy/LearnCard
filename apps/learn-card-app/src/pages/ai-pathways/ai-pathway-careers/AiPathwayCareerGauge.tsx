import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type CareerGaugeProps = {
    title: string;
    score: number; // 0–100
};

const GAUGE_ZONES = [
    { value: 25, color: '#FECDD3' },
    { value: 25, color: '#FFF1F2' },
    { value: 25, color: 'rgba(248, 254, 248, 0.80)' },
    { value: 25, color: '#D1FAE5' },
];

const getLabel = (score: number) => {
    if (score < 20) return 'Very Poor';
    if (score < 35) return 'Poor';
    if (score < 50) return 'Below Average';
    if (score < 65) return 'Average';
    if (score < 80) return 'Good';
    if (score < 90) return 'Very Good';
    return 'Excellent';
};

export const AiPathwayCareerGauge = ({ title, score }: CareerGaugeProps) => {
    const angle = 180 - (score / 100) * 180;
    const mainNeedleLength = 94;
    const label = getLabel(score);

    return (
        <div className="w-[260px] text-center flex flex-col gap-[10px]">
            <p className="text-[14px] text-grayscale-900 leading-[18px">{title}</p>

            <div className="relative w-full h-[130px]">
                {/* Base gauge */}
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={GAUGE_ZONES}
                            startAngle={180}
                            endAngle={0}
                            innerRadius="55%"
                            outerRadius="100%"
                            dataKey="value"
                            stroke="oklch(44.6% 0.043 257.281)"
                            strokeWidth={2}
                        >
                            {GAUGE_ZONES.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/*  Zone divider lines + bounds */}
                <svg
                    viewBox="0 0 260 160"
                    className="absolute top-[30%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none"
                >
                    {/* Zone dividers */}
                    {[30, 60, 90, 120, 150].map(deg => {
                        const r1 = 77;
                        const r2 = 107;
                        return (
                            <line
                                key={deg}
                                x1={130 + r1 * Math.cos((Math.PI * deg) / 180)}
                                y1={130 - r1 * Math.sin((Math.PI * deg) / 180)}
                                x2={130 + r2 * Math.cos((Math.PI * deg) / 180)}
                                y2={130 - r2 * Math.sin((Math.PI * deg) / 180)}
                                stroke="#222"
                                strokeWidth="2"
                                strokeDasharray="6 6"
                            />
                        );
                    })}

                    {/* 0% boundary */}
                    <line
                        x1={130 - 78}
                        y1={130}
                        x2={130 - 100}
                        y2={130}
                        stroke="#222"
                        strokeWidth="2"
                        strokeDasharray="3 4"
                    />

                    {/* 100% boundary */}
                    <line
                        x1={130 + 78}
                        y1={130}
                        x2={130 + 100}
                        y2={130}
                        stroke="#222"
                        strokeWidth="2"
                        strokeDasharray="3 4"
                    />
                </svg>
                {/* SVG 2: Needle */}
                <svg
                    viewBox="0 0 260 160"
                    className="absolute top-[33%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none"
                >
                    {/* main needle */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 + mainNeedleLength * Math.cos((Math.PI * angle) / 180)}
                        y2={130 - mainNeedleLength * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />

                    {/* Needle tail (longer, behind pivot) */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 - 32 * Math.cos((Math.PI * angle) / 180)}
                        y2={130 + 32 * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="6"
                        strokeLinecap="round"
                    />

                    {/* Pivot outer ring */}
                    <circle cx="130" cy="130" r="18" fill="white" stroke="#222" strokeWidth="2" />

                    {/* Center pivot */}
                    <circle cx="130" cy="130" r="6" fill="#222" />
                </svg>
            </div>

            <p className="mt-[-50px] text-grayscale-900 text-sm font-semibold">{label}</p>
        </div>
    );
};

export default AiPathwayCareerGauge;
