import { BarChart, Bar, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';

const data = [
    { bucket: 1, value: 6 },
    { bucket: 2, value: 9 },
    { bucket: 3, value: 12 },
    { bucket: 4, value: 7 },
    { bucket: 5, value: 14 }, // median bucket
    { bucket: 6, value: 11 },
    { bucket: 7, value: 11 },
    { bucket: 8, value: 7 },
    { bucket: 9, value: 4 },
    { bucket: 10, value: 2 },
];

const MEDIAN_BUCKET = 5;

export const AiPathwayCareerPipeChart = () => {
    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {/* Median overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    color: '#333',
                    zIndex: 2,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#2d2d2d',
                    }}
                />
                <span>Median: $104,000</span>
            </div>

            {/* Chart */}
            <div style={{ width: '100%', height: 240 }}>
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
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    marginTop: 2,
                    fontSize: 14,
                    color: '#444',
                }}
            >
                <span>$45,000</span>
                <span>$138,000</span>
            </div>
        </div>
    );
};

export default AiPathwayCareerPipeChart;
