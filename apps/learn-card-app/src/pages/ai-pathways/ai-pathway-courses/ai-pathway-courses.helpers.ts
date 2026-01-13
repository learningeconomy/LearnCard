import { OccupationDetailsOptions } from 'learn-card-base/types/careerOneStop';
import Megaphone from '../../../assets/images/course.megaphone.icon.png';

export type AiPathwayCourse = {
    id: number;
    title: string;
    description: string;
    provider: string;
    durationAvg: string;
    durationTotal: string;
    topics: string[];
    rating: number;
    source: string;
    image: string;
};

export const getCoursesFromTrainingPrograms = (trainingPrograms: any[]) => {
    const courses = trainingPrograms.flatMap(trainingProgram => {
        return trainingProgram?.syllabusCourses;
    });
    return courses;
};
