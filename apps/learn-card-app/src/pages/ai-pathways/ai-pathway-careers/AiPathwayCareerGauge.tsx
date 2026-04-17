import { PieChart, Pie, Cell } from 'recharts';

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

const polarToCartesian = (cx: number, cy: number, r: number, angleDegrees: number) => {
    const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(angleRadians),
        y: cy + r * Math.sin(angleRadians),
    };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

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
            <p className="text-[14px] text-grayscale-900 leading-[18px]">{title}</p>

            <div className="relative w-full h-[85px] overflow-hidden">
                {/* Base gauge */}
                <div
                    className="absolute left-1/2 top-0 h-[160px] w-[260px] pointer-events-none"
                    style={{
                        transform: 'translateX(calc(-50% - 3px)) translateY(-2px) scale(0.53125)',
                        transformOrigin: 'top center',
                    }}
                >
                    <PieChart width={260} height={160}>
                        <Pie
                            data={GAUGE_ZONES}
                            cx={130}
                            cy={130}
                            startAngle={180}
                            endAngle={0}
                            innerRadius={67}
                            outerRadius={123}
                            dataKey="value"
                            stroke="none"
                            strokeWidth={0}
                        >
                            {GAUGE_ZONES.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </div>

                {/*  Zone divider lines + bounds */}
                <svg
                    viewBox="0 0 260 160"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    {/* Outer and inner bounds */}
                    <path
                        d={describeArc(130, 131, 121, 270, 90)}
                        fill="none"
                        stroke="#222"
                        strokeWidth="5"
                    />
                    <path
                        d={describeArc(130, 131, 67, 270, 90)}
                        fill="none"
                        stroke="#222"
                        strokeWidth="5"
                    />

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
                        x2={130 - 108}
                        y2={130}
                        stroke="#222"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                    />

                    {/* 100% boundary */}
                    <line
                        x1={130 + 78}
                        y1={130}
                        x2={130 + 108}
                        y2={130}
                        stroke="#222"
                        strokeWidth="2"
                        strokeDasharray="6 6"
                    />
                </svg>
                {/* SVG 2: Needle */}
                <svg
                    viewBox="0 0 260 160"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    {/* main needle */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 + mainNeedleLength * Math.cos((Math.PI * angle) / 180)}
                        y2={130 - mainNeedleLength * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />

                    {/* Needle tail (longer, behind pivot) */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 - 32 * Math.cos((Math.PI * angle) / 180)}
                        y2={130 + 32 * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />

                    {/* Pivot outer ring */}
                    <circle cx="130" cy="130" r="18" fill="white" stroke="#222" strokeWidth="4" />

                    {/* Center pivot */}
                    <circle cx="130" cy="130" r="5" fill="#222" />
                </svg>
            </div>
        </div>
    );
};

export default AiPathwayCareerGauge;
