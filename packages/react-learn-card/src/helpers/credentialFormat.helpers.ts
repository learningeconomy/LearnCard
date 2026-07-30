export const humanizeClaimLabel = (key: string): string => {
    if (!key) return '';

    // Preserve acronyms if all-caps
    if (/^[A-Z]+$/.test(key)) {
        return key;
    }

    // Convert snake_case and kebab-case to space-separated
    let humanized = key.replace(/[_-]/g, ' ');

    // Convert camelCase to space-separated
    humanized = humanized.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Capitalize first letter of each word
    return humanized
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const LONG_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};

export const formatClaimValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [y, m, d] = value.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d));
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(undefined, { ...LONG_DATE_FORMAT, timeZone: 'UTC' });
            }
        }
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString(undefined, LONG_DATE_FORMAT);
            }
        }
        return value;
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            const allPrimitive = value.every(v => v === null || typeof v !== 'object');
            if (allPrimitive) return value.map(formatClaimValue).filter(Boolean).join(', ');
            return value.length === 1 ? '1 item' : `${value.length} items`;
        }
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) return '';
        return entries
            .map(([k, v]) => `${humanizeClaimLabel(k)}: ${formatClaimValue(v)}`)
            .join('; ');
    }

    return String(value);
};
