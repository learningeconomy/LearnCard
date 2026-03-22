import _ from 'lodash';

import { TrainingProgram } from 'learn-card-base/types/careerOneStop';

const TEXT_TOKEN_MAP: Record<string, string> = {
    apos: "'",
    amp: '&',
    quot: '"',
    lt: '<',
    gt: '>',
    nbsp: ' ',
};

const decodeTextToken = (token?: string) => {
    if (!token) return ' ';
    return TEXT_TOKEN_MAP[token.toLowerCase()] ?? ' ';
};

export const normalizeSchoolPrograms = (trainingPrograms: TrainingProgram[]) => {
    const randomSchoolPrograms = _.shuffle([...trainingPrograms]);

    const selectedSchoolPrograms = randomSchoolPrograms;

    const schoolPrograms = selectedSchoolPrograms.map((program: any) => ({
        ...(program?.SchoolPrograms?.[0] || {}),
        keyword: program?.keyword,
        courses: program?.syllabusCourses,
        occupationDetails: program?.occupationDetails,
        school: program?.syllabusCourses?.[0]?.institution,
    }));

    return schoolPrograms;
};

export const filterCoursesByFieldOfStudy = (
    trainingPrograms: TrainingProgram[],
    fieldOfStudy: string
) => {
    // Extract all courses from all training programs
    const allCourses = trainingPrograms?.flatMap((program: any) => {
        return (program?.courses || []).map((course: any) => ({
            ...course,
            occupationDetails: program?.occupationDetails,
            keyword: program?.keyword,
        }));
    });

    // Filter courses by field of study
    const filteredCourses = allCourses.filter((course: any) => {
        return course?.field?.field === fieldOfStudy;
    });

    // Randomize the filtered courses before returning
    return _.shuffle(filteredCourses);
};

export const getOccupationTags = (occupationDetails: any) => {
    const tags = occupationDetails?.AlternateTitles || [];
    const occupationTitle = occupationDetails?.OnetTitle || '';
    return tags?.length > 0 ? tags?.slice(0, 3)?.join(', ') : occupationTitle;
};

export const normalizeProgramLengthText = (value?: string) => {
    if (!value) return '';

    return value
        .replace(
            /&([a-z]+);|~[a-z]~([a-z0-9]+)~[a-z]~/gi,
            (_, entityToken?: string, wrappedToken?: string) =>
                decodeTextToken(entityToken ?? wrappedToken)
        )
        .replace(/^\s*beyond\s+/i, '')
        .replace(/~[a-z]~/gi, ' ')
        .replace(/~/g, ' ')
        .replace(/\s+,/g, ',')
        .replace(/\s+/g, ' ')
        .trim();
};

const getAverageDurationForDegree = (value: string) => {
    if (/\bassociate(?:'s)?\b/i.test(value)) return 'usually 2 years to complete';
    if (/\bbachelor(?:'s)?\b/i.test(value)) return 'usually 4 years to complete';
    if (/\bmaster(?:'s)?\b/i.test(value)) return 'usually 2 years to complete';
    return '';
};

export const getProgramLengthDisplay = (program?: TrainingProgram) => {
    const normalizedName = normalizeProgramLengthText(program?.ProgramLength?.[0]?.Name);
    const normalizedValue = normalizeProgramLengthText(program?.ProgramLength?.[0]?.Value);

    const durationPattern =
        /\b(?:usually\s+)?(?:about\s+)?(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:year|years|month|months|week|weeks|day|days)(?:\s+to\s+complete)?\b/i;

    const durationFromValue = normalizedValue.match(durationPattern)?.[0];
    const inferredDuration = getAverageDurationForDegree(
        `${normalizedName} ${normalizedValue}`.trim()
    );

    if (normalizedName) {
        const nameHasDuration = durationPattern.test(normalizedName);
        if (!nameHasDuration && durationFromValue) return `${normalizedName}, ${durationFromValue}`;
        if (!nameHasDuration && inferredDuration) return `${normalizedName}, ${inferredDuration}`;
        return normalizedName;
    }

    if (normalizedValue && !durationFromValue && inferredDuration)
        return `${normalizedValue}, ${inferredDuration}`;

    return normalizedValue;
};
