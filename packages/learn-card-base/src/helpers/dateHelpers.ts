import moment from 'moment';

export const getSeason = (_date: Date | string): 'Fall' | 'Winter' | 'Summer' | 'Spring' => {
    const date = typeof _date === 'string' ? new Date(_date) : _date;

    const month = date.getMonth();
    const day = date.getDate();

    if ((month === 11 && day >= 21) || month < 2 || (month === 2 && day <= 19)) return 'Winter';
    if ((month === 2 && day >= 20) || month < 5 || (month === 5 && day <= 20)) return 'Spring';
    if ((month === 5 && day >= 21) || month < 8 || (month === 8 && day <= 21)) return 'Summer';

    return 'Fall';
};

export const isValidISOString = (dateString: string) => {
    return moment(dateString, moment.ISO_8601, true).isValid();
};

// Returns the age in whole years, or NaN if the input is invalid.
export const calculateAge = (dob: string | Date, now: Date = new Date()): number => {
    const dobMoment =
        typeof dob === 'string' ? moment(dob, moment.ISO_8601, true) : moment(dob);

    if (!dobMoment.isValid()) return Number.NaN;

    return moment(now).diff(dobMoment, 'years');
};
