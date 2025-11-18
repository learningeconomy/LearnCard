export const ellipsisMiddle = (str: string, start: number = 0, end: number = 0) => {
    if (!str) return '';
    // Define the number of characters to preserve at the beginning and end
    const preserveStart = start;
    const preserveEnd = end;

    // Extract the preserved portions and create the truncated string
    const truncatedString = `${str.substr(0, preserveStart)}...${str.substr(
        str.length - preserveEnd,
        preserveEnd
    )}`;

    return truncatedString;
};

export const splitAtCapitalLetters = (str: string) => {
    if (!str) return '';

    // Split the string at each capital letter
    const substrings = str.split(/(?=[A-Z])/);

    // Combine the substrings into a single string
    const combinedString = substrings.join(' ');

    return combinedString;
};

export const truncateWithEllipsis = (str: string, maxLength: number) => {
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

export const capitalize = (string?: string): string => {
    return string ? string[0].toUpperCase() + string.slice(1) : '';
};

export const pluralize = (word: string, count: number) => {
    return count === 1 ? word : `${word}s`;
};

// Same thing as pluralize, but returns count prepended to the potentially pluralized word
export const conditionalPluralize = (
    count: number | string | undefined,
    noun: string,
    options: {
        includeCount?: boolean;
    } = {}
) => {
    const { includeCount = true } = options;
    return `${includeCount ? `${count} ` : ''}${noun}${count !== 1 && count !== '1' ? 's' : ''}`;
};

export const getLastNameOrFirst = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return '';

    const names = fullName.trim().split(' ');
    return names.length > 1 ? names[names.length - 1] : names[0];
};

export const getFirstName = (fullName: string): string => {
    if (!fullName || typeof fullName !== 'string') return '';

    const names = fullName.trim().split(' ');
    return names.length > 1 ? names?.[0] : fullName;
};

// "one TwoThree" -> "one-two-three"
export const toKebabCase = (str: string): string => {
    return str
        .trim() // Remove leading/trailing spaces
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between camel case transitions
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase(); // Convert to lowercase
};

export const joinWithAnd = (strings: string[]) => {
    const len = strings.length;
    if (len === 0) return '';
    if (len === 1) return strings[0];
    if (len === 2) return `${strings[0]} and ${strings[1]}`;
    return `${strings.slice(0, -1).join(', ')}, and ${strings[len - 1]}`;
};
