export const percentile = (values: number[], p: number): number => {
    if (values.length === 0) return 0;
    if (values.length === 1) return values[0];
    const sorted = [...values].sort((a, b) => a - b);
    const rank = Math.ceil((p / 100) * sorted.length);
    return sorted[Math.min(rank, sorted.length) - 1];
};

export type Summary = { p50: number; p95: number; p99: number };

export const summarize = (values: number[]): Summary => ({
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
});
