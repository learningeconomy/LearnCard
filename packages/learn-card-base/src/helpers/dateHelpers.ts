export {
    calculateLocalAge as calculateAge,
    isFutureDate,
    isValidISOString,
} from '@learncard/helpers';

export const getSeason = (_date: Date | string): 'Fall' | 'Winter' | 'Summer' | 'Spring' => {
    const date = typeof _date === 'string' ? new Date(_date) : _date;

    const month = date.getMonth();
    const day = date.getDate();

    if ((month === 11 && day >= 21) || month < 2 || (month === 2 && day <= 19)) return 'Winter';
    if ((month === 2 && day >= 20) || month < 5 || (month === 5 && day <= 20)) return 'Spring';
    if ((month === 5 && day >= 21) || month < 8 || (month === 8 && day <= 21)) return 'Summer';

    return 'Fall';
};
