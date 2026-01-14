import _ from 'lodash';

import { TrainingProgram } from 'learn-card-base/types/careerOneStop';

export const normalizeSchoolPrograms = (trainingPrograms: TrainingProgram[]) => {
    const randomSchoolPrograms = _.sortBy([...trainingPrograms], () => Math.random() - 0.5);

    const selectedSchoolPrograms = randomSchoolPrograms.slice(0, 3);

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
    return _.sortBy(filteredCourses, () => Math.random() - 0.5);
};

export const getOccupationTags = (occupationDetails: any) => {
    const tags = occupationDetails?.length > 0 ? occupationDetails?.[0]?.AlternateTitles : [];
    const occupationTitle =
        occupationDetails?.length > 0 ? [occupationDetails?.[0]?.OnetTitle] : [];
    return tags?.length > 0 ? tags?.slice(0, 3)?.join(', ') : occupationTitle?.join(', ');
};
