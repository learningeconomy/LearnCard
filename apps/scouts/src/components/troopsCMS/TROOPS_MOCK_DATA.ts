import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { defaultTroopState } from './troopCMSState';

export const TROOPS_MOCK_DATA = [
    {
        id: '1',
        ...defaultTroopState,
        basicInfo: {
            ...defaultTroopState.basicInfo,
            name: 'Girl Scouts of the USA',
            description:
                "Scouting's mission is to contribute to the education of young people through a value system based on the Scout Promise and Law. Through Scouting, we are building a better world where people are self-fulfilled as individuals and play a constructive role in society. To be the world’s most inspiring and inclusive youth movement, creating transformative learning experiences for every young person, everywhere.",
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
            description:
                "The BSA's mission is to instill the values of the Scout Oath and Law, which include being trustworthy, loyal, helpful, and more. The BSA also aims to create a welcoming environment where young people can learn from and respect each other.",
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
