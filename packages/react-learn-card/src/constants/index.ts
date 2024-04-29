import coinsGraphic from '../assets/images/walletcurrency.webp';
import idsGraphic from '../assets/images/walletids.webp';
import learningHistoryGraphic from '../assets/images/walletlearninghistory.svg';
import skillsGraphic from '../assets/images/walletskills.webp';
import achievementsGraphic from '../assets/images/walletTrophy.svg';
import socialBadge from '../assets/images/social-badge-2.svg';
import experienceMountain from '../assets/images/experience-mountain.svg';
import goalsTarget from '../assets/images/goals-target.svg';
import apple from '../assets/images/apple.png';
import relationshipCats from '../assets/images/relationships-cats.svg';
import membershipKey from '../assets/images/membership-key.svg';
import accommodationHands from '../assets/images/Accommodation-Hands.png';
import eventsGraphic from '../assets/images/eventsGraphic.svg';

import MiniTrophyIcon from '../assets/images/minitrophycolored.svg';
import MiniGradIcon from '../assets/images/minigradcapcolored.svg';
import MiniPuzzleIcon from '../assets/images/minipuzzlecolored.svg';
import { LCSubtypes, WalletCategoryTypes } from '../types';

export const TYPE_TO_MINI_ICON: any = {
    [LCSubtypes.course]: MiniGradIcon,
    [LCSubtypes.achievement]: MiniTrophyIcon,
    [LCSubtypes.skill]: MiniPuzzleIcon,
};

// courses(learningHistory - ladder), social badges, achievements, accomplishments,
// skills, experiences, relationships, accommodations
// todo - memberships, goals
// deprecated - ids, currency
export const TYPE_TO_IMG_SRC = {
    [WalletCategoryTypes.learningHistory]: apple,
    [WalletCategoryTypes.socialBadge]: socialBadge,
    [WalletCategoryTypes.achievements]: achievementsGraphic,
    [WalletCategoryTypes.accomplishments]: learningHistoryGraphic,
    [WalletCategoryTypes.skills]: skillsGraphic,
    [WalletCategoryTypes.jobHistory]: experienceMountain,
    [WalletCategoryTypes.relationships]: relationshipCats,
    [WalletCategoryTypes.accommodations]: accommodationHands,
    [WalletCategoryTypes.events]: eventsGraphic,

    // todo
    [WalletCategoryTypes.membership]: membershipKey,
    [WalletCategoryTypes.goals]: goalsTarget,

    // deprecated
    [WalletCategoryTypes.ids]: idsGraphic,
    [WalletCategoryTypes.currency]: coinsGraphic,
};

export const TYPE_TO_WALLET_COLOR = {
    [WalletCategoryTypes.learningHistory]: 'emerald-300',
    [WalletCategoryTypes.socialBadge]: 'cyan-300',
    [WalletCategoryTypes.achievements]: 'orange-300',
    [WalletCategoryTypes.accomplishments]: 'lime-300',
    [WalletCategoryTypes.skills]: 'violet-300',
    [WalletCategoryTypes.jobHistory]: 'blue-300',
    [WalletCategoryTypes.relationships]: 'pink-300',
    [WalletCategoryTypes.accommodations]: 'amber-300',
    [WalletCategoryTypes.events]: 'fuchsia-300',

    // todo
    [WalletCategoryTypes.membership]: 'teal-300',
    [WalletCategoryTypes.goals]: 'rose-300',

    // deprecated
    [WalletCategoryTypes.ids]: 'yellow-300',
    [WalletCategoryTypes.currency]: 'cyan-300',
};

export const TYPE_TO_WALLET_LIGHT_COLOR = {
    [WalletCategoryTypes.learningHistory]: 'emerald-200',
    [WalletCategoryTypes.socialBadge]: 'cyan-200',
    [WalletCategoryTypes.achievements]: 'orange-200',
    [WalletCategoryTypes.accomplishments]: 'lime-200',
    [WalletCategoryTypes.skills]: 'violet-200',
    [WalletCategoryTypes.jobHistory]: 'blue-200',
    [WalletCategoryTypes.relationships]: 'pink-200',
    [WalletCategoryTypes.accommodations]: 'amber-200',
    [WalletCategoryTypes.events]: 'fuchsia-200',

    // todo
    [WalletCategoryTypes.membership]: 'teal-200',
    [WalletCategoryTypes.goals]: 'rose-200',

    // deprecated
    [WalletCategoryTypes.ids]: 'yellow-200',
    [WalletCategoryTypes.currency]: 'cyan-200',
};

export const TYPE_TO_WALLET_DARK_COLOR = {
    [WalletCategoryTypes.learningHistory]: 'emerald-500',
    [WalletCategoryTypes.socialBadge]: 'cyan-500',
    [WalletCategoryTypes.achievements]: 'orange-500',
    [WalletCategoryTypes.accomplishments]: 'lime-500',
    [WalletCategoryTypes.skills]: 'violet-500',
    [WalletCategoryTypes.jobHistory]: 'blue-500',
    [WalletCategoryTypes.relationships]: 'pink-500',
    [WalletCategoryTypes.accommodations]: 'amber-500',
    [WalletCategoryTypes.events]: 'fuchsia-500',

    // todo
    [WalletCategoryTypes.membership]: 'teal-500',
    [WalletCategoryTypes.goals]: 'rose-500',

    // deprecated
    [WalletCategoryTypes.ids]: 'yellow-500',
    [WalletCategoryTypes.currency]: 'cyan-500',
};
