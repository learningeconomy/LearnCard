import _ from 'lodash';

import { TrainingProgram } from 'learn-card-base/types/careerOneStop';

export const normalizeSchoolPrograms = (trainingPrograms: TrainingProgram[]) => {
    const randomSchoolPrograms = _.sortBy([...trainingPrograms], () => Math.random() - 0.5);

    const selectedSchoolPrograms = randomSchoolPrograms.slice(0, 3);

    const schoolPrograms = selectedSchoolPrograms.map((program: any) => ({
        ...(program?.SchoolPrograms?.[0] || {}),
        keyword: program?.keyword,
        courses: program?.syllabusCourses,
        school: program?.syllabusCourses?.[0]?.institution,
    }));

    return schoolPrograms;
};

export const filterCoursesByFieldOfStudy = (courses: any[], fieldOfStudy: string) => {
    return courses.filter((course: any) => {
        return course?.field?.field === fieldOfStudy;
    });
};
