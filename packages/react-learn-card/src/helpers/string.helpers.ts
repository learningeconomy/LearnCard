export const truncateWithEllipsis = (str: string, maxLength: number) => {
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

export const capitalize = (string?: string): string => {
    return string ? string[0].toUpperCase() + string.slice(1) : '';
};
