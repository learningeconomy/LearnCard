export const formatDateForLocale = (value: string, locale: string): string => {
    if (!value) return '';

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
};
