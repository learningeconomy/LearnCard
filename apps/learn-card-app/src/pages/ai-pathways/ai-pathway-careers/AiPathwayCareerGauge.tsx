import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type CareerGaugeProps = {
    title: string;
    score: number; // 0–100
};

const GAUGE_ZONES = [
    { value: 25, color: '#f2c6c6' },
    { value: 25, color: '#f1e6e2' },
    { value: 25, color: '#f5f5f5' },
    { value: 25, color: '#cfe9d6' },
];

const getLabel = (score: number) => {
    if (score < 40) return 'Poor';
    if (score < 55) return 'Average';
    if (score < 70) return 'Satisfactory';
    if (score < 85) return 'Good';
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
                            innerRadius="65%"
                            outerRadius="100%"
                            dataKey="value"
                        >
                            {GAUGE_ZONES.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/*  Zone divider lines + bounds */}
                <svg viewBox="0 0 260 140" className="absolute top-[-10%] pointer-events-none">
                    {/* Zone dividers */}
                    {[135, 90, 45].map(deg => {
                        const r1 = 78;
                        const r2 = 100;
                        return (
                            <line
                                key={deg}
                                x1={130 + r1 * Math.cos((Math.PI * deg) / 180)}
                                y1={130 - r1 * Math.sin((Math.PI * deg) / 180)}
                                x2={130 + r2 * Math.cos((Math.PI * deg) / 180)}
                                y2={130 - r2 * Math.sin((Math.PI * deg) / 180)}
                                stroke="#222"
                                strokeWidth="1.5"
                                strokeDasharray="3 4"
                            />
                        );
                    })}

                    {/* 0% boundary (left) */}
                    <line
                        x1={130 + 78 * Math.cos(Math.PI)}
                        y1={130 - 78 * Math.sin(Math.PI)}
                        x2={130 + 100 * Math.cos(Math.PI)}
                        y2={130 - 100 * Math.sin(Math.PI)}
                        stroke="#222"
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                    />

                    {/* 100% boundary (right) */}
                    <line
                        x1={130 + 78}
                        y1={130}
                        x2={130 + 100}
                        y2={130}
                        stroke="#222"
                        strokeWidth="1.5"
                        strokeDasharray="3 4"
                    />
                </svg>
                {/* SVG 2: Needle */}
                <svg
                    viewBox="0 0 260 140"
                    className="absolute top-[25%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none"
                >
                    {/* Needle */}
                    {/* Needle */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 + 140 * Math.cos((Math.PI * angle) / 180)}
                        y2={130 - 140 * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="3"
                    />

                    {/* Center pivot */}
                    <circle cx="130" cy="130" r="6" fill="#222" />
                </svg>
            </div>

            <p className="mt-[-50px] text-grayscale-900 text-sm font-semibold">{label}</p>
        </div>
    );
};

export default AiPathwayCareerGauge;
