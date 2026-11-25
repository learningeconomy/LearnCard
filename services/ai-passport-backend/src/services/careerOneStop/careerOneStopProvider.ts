import type { PathwaysResourceProvider } from '../pathways/pathwaysProvider';
import { PathwaysProviderEnum } from '../pathways/pathwaysProvider.types';
import {
    getOccupationDetailsForKeyword,
    getCareerOneStopVideo,
    getSalariesByKeywordCompare,
    getTrainingProgramsByKeyword,
} from './careerOneStop';
import { getCareerOneStopConfig } from './careerOneStopConfig';

export const careerOneStopProvider: PathwaysResourceProvider = {
    id: PathwaysProviderEnum.CareerOneStop,
    isEnabled: () => Boolean(getCareerOneStopConfig()),
    getOccupationDetails: ({ keyword, limit, topNDetails }) =>
        getOccupationDetailsForKeyword(keyword, limit, topNDetails),
    getSalaries: ({ keyword, locations }) => getSalariesByKeywordCompare({ keyword, locations }),
    getTrainingPrograms: ({ keyword }) => getTrainingProgramsByKeyword({ keyword }),
    getVideo: videoCode => getCareerOneStopVideo(videoCode),
};
