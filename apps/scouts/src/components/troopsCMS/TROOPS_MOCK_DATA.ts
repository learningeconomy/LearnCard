import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { defaultTroopState } from './troopCMSState';

export const TROOPS_MOCK_DATA = [
    {
        id: '1',
        ...defaultTroopState,
        basicInfo: {
            ...defaultTroopState.basicInfo,
            name: 'Girl Scouts of the USA',
            descriptionKey: 'troops.worldScoutingMission',
            achievementType: AchievementTypes.Network,
        },
        appearance: {
            ...defaultTroopState.appearance,
            backgroundImage: 'https://cdn.filestackcontent.com/H815W3JUSbW9De76oZ0c',
            idIssuerThumbnail: 'https://cdn.filestackcontent.com/JV2GuaXCS9yEoGciyGxP',
            badgeThumbnail: 'https://cdn.filestackcontent.com/JV2GuaXCS9yEoGciyGxP',
            fadeBackgroundImage: true,
            repeatBackgroundImage: true,
        },
    },
    {
        id: '2',
        ...defaultTroopState,
        basicInfo: {
            ...defaultTroopState.basicInfo,
            name: 'Boy Scouts of America',
            descriptionKey: 'troops.bsaMission',
            achievementType: AchievementTypes.Network,
        },
        appearance: {
            ...defaultTroopState.appearance,
            backgroundImage: 'https://cdn.filestackcontent.com/H815W3JUSbW9De76oZ0c',
            idIssuerThumbnail: 'https://cdn.filestackcontent.com/wTgKNEzcRW6OVCZcN3Eb',
            badgeThumbnail: 'https://cdn.filestackcontent.com/wTgKNEzcRW6OVCZcN3Eb',
            fadeBackgroundImage: true,
            repeatBackgroundImage: true,
        },
    },
];
