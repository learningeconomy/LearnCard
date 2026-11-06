import type { PathwaysResourceProvider } from '../pathways/pathwaysProvider';
import { PathwaysProviderEnum } from '../pathways/pathwaysProvider.types';
import { fetchSyllabi, type OpenSyllabusCoursesParams } from './openSyllabus';
import { getOpenSyllabusConfig } from './openSyllabusConfig';

export const openSyllabusProvider: PathwaysResourceProvider = {
    id: PathwaysProviderEnum.OpenSyllabus,
    isEnabled: () => Boolean(getOpenSyllabusConfig()),
    getCourses: (params: OpenSyllabusCoursesParams) => fetchSyllabi(params),
};
