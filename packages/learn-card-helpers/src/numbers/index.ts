/**
 * Formats a number into a friendlier string i.e. 1,234 becomes 1.2K
 */
export const formatNumber = (num: number): string => {
    const abbreviations = [
        { value: 1e9, symbol: 'B' },
        { value: 1e6, symbol: 'M' },
        { value: 1e3, symbol: 'K' }
    ];

    for (const { value, symbol } of abbreviations) {
        if (num >= value) {
            // Round to 1 decimal place and remove trailing zero
            const result = (Math.floor(num / (value / 10)) / 10).toFixed(1);
            return result.replace(/\.0$/, '') + symbol;
        }
    }

    // For numbers less than 1000, return as is, but without decimal places
    return Math.floor(num).toString();
}
