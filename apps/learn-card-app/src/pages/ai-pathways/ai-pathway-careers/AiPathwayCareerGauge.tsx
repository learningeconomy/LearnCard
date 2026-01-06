import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

type CareerGaugeProps = {
    title: string;
    score: number; // 0–100
};

const GAUGE_ZONES = [
    { value: 35, color: '#f2c6c6' }, // low
    { value: 30, color: '#f5f5f5' }, // mid
    { value: 35, color: '#cfe9d6' }, // high
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
        <div
            style={{
                width: 260,
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 8,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: 140,
                }}
            >
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={GAUGE_ZONES}
                            startAngle={180}
                            endAngle={0}
                            innerRadius="65%"
                            outerRadius="100%"
                            paddingAngle={0}
                            dataKey="value"
                        >
                            {GAUGE_ZONES.map((entry, index) => (
                                <Cell key={index} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Needle */}
                <svg
                    viewBox="0 0 260 140"
                    width="100%"
                    height="100%"
                    className="absolute top-[15%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
                >
                    {/* Needle line */}
                    <line
                        x1="130"
                        y1="130"
                        x2={130 + 70 * Math.cos((Math.PI * angle) / 180)}
                        y2={130 - 70 * Math.sin((Math.PI * angle) / 180)}
                        stroke="#222"
                        strokeWidth="3"
                    />

                    {/* Center dot */}
                    <circle cx="130" cy="130" r="6" fill="#222" />
                </svg>
            </div>

            <p className="text-grayscale-900 text-sm font-semibold">{label}</p>
        </div>
    );
};

export default AiPathwayCareerGauge;
