import {
    appsOutline,
    chatbubblesOutline,
    desktopOutline,
    linkOutline,
    serverOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';
import type { LaunchType } from '@learncard/types';

export const LISTING_TYPES: Array<{
    type: LaunchType;
    title: string;
    description: string;
    icon: string;
}> = [
    {
        type: 'EMBEDDED_IFRAME',
        title: 'Runs inside LearnCard',
        description: 'Set up an embedded app by hand: your address, permissions, and settings.',
        icon: appsOutline,
    },
    {
        type: 'DIRECT_LINK',
        title: 'Opens in a new tab',
        description: 'Send people to your website.',
        icon: linkOutline,
    },
    {
        type: 'CONSENT_REDIRECT',
        title: 'Connects, then goes to your site',
        description: 'People share info with you, then land on your site.',
        icon: shieldCheckmarkOutline,
    },
    {
        type: 'AI_TUTOR',
        title: 'AI tutor',
        description: 'A tutor that helps learners with what they know.',
        icon: chatbubblesOutline,
    },
    {
        type: 'SECOND_SCREEN',
        title: 'Pairs with a second screen',
        description: 'Runs on another device, like a classroom display.',
        icon: desktopOutline,
    },
    {
        type: 'SERVER_HEADLESS',
        title: 'Runs on a server',
        description: 'No screen. Your service works with LearnCard behind the scenes.',
        icon: serverOutline,
    },
];
