import type { PathwaysResourceProvider } from '../pathways/pathwaysProvider';
import { PathwaysProviderEnum } from '../pathways/pathwaysProvider.types';
import { getYouTubeConfig } from './youtubeConfig';
import { searchApprovedChannels } from './youtubeService';

export const youtubeProvider: PathwaysResourceProvider = {
    id: PathwaysProviderEnum.YouTube,
    isEnabled: () => Boolean(getYouTubeConfig()),
    searchVideos: keyword => searchApprovedChannels(keyword),
};
