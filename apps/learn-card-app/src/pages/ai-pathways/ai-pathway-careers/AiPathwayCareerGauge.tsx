import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type CareerGaugeProps = {
    title: string;
    score: number; // 0–100
};

const GAUGE_ZONES = [
    { value: 25, color: 'oklch(98% 0.062 18.334)' },
    { value: 25, color: 'oklch(99% 0.032 17.717)' },
    { value: 25, color: 'oklch(99% 0.018 155.826)' },
    { value: 25, color: 'oklch(98% 0.044 156.743)' },
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
    const label = getLabel(score);

    return (
        <div className="w-[260px] text-center">
            <p className="text-sm mb-1 text-grayscale-900">{title}</p>

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
                    viewBox="0 0 275 130"
                    className="absolute left-[5%] top-[-7%] pointer-events-none"
                >
                    {/* Zone dividers */}
                    {[30, 60, 90, 120, 150].map(deg => {
                        const r1 = 68;
                        const r2 = 100;
                        return (
                            <line
                                key={deg}
                                x1={130 + r1 * Math.cos((Math.PI * deg) / 180)}
                                y1={130 - r1 * Math.sin((Math.PI * deg) / 180)}
                                x2={130 + r2 * Math.cos((Math.PI * deg) / 180)}
                                y2={130 - r2 * Math.sin((Math.PI * deg) / 180)}
                                stroke="#222"
                                strokeWidth="2"
                                strokeDasharray="3 4"
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
                    viewBox="0 0 260 140"
                    className="absolute top-[25%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none"
                >
                    {/* Needle */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 + 140 * Math.cos((Math.PI * angle) / 180)}
                        y2={130 - 140 * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="6"
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
