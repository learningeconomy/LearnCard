import coinsGraphic from '../../assets/images/walletcurrency.webp';
import idsGraphic from '../../assets/images/walletids.webp';
import jobhistoryGraphic from '../../assets/images/walletjobhistory.webp';
import learningHistoryGraphic from '../../assets/images/walletlearninghistory.webp';
import skillsGraphic from '../../assets/images/walletskills.webp';
import achievementsGraphic from '../../assets/images/walletTrophy.webp';
import badgeGraphic from '../../assets/images/badge.png';

import MiniTrophyIcon from '../../assets/images/minitrophycolored.svg';
import MiniGradIcon from '../../assets/images/minigradcapcolored.svg';
import MiniPuzzleIcon from '../../assets/images/minipuzzlecolored.svg';
import { LCSubtypes } from '../../types';

export const TYPE_TO_MINI_ICON: any = {
    [LCSubtypes.course]: MiniGradIcon,
    [LCSubtypes.achievement]: MiniTrophyIcon,
    [LCSubtypes.skill]: MiniPuzzleIcon,
};

export const WALLET_SUBTYPES = {
    ACHIEVEMENTS: 'achievements',
    IDS: 'ids',
    JOB_HISTORY: 'jobHistory',
    CURRENCIES: 'currency',
    LEARNING_HISTORY: 'learningHistory',
    SKILLS: 'skills',
    SOCIAL_BADGES: 'socialBadges',
};

export const TYPE_TO_IMG_SRC = {
    [WALLET_SUBTYPES.ACHIEVEMENTS]: achievementsGraphic,
    [WALLET_SUBTYPES.IDS]: idsGraphic,
    [WALLET_SUBTYPES.JOB_HISTORY]: jobhistoryGraphic,
    [WALLET_SUBTYPES.LEARNING_HISTORY]: learningHistoryGraphic,
    [WALLET_SUBTYPES.CURRENCIES]: coinsGraphic,
    [WALLET_SUBTYPES.SKILLS]: skillsGraphic,
    [WALLET_SUBTYPES.SOCIAL_BADGES]: badgeGraphic,
};

export const TYPE_TO_WALLET_COLOR = {
    [WALLET_SUBTYPES.ACHIEVEMENTS]: 'spice-300',
    [WALLET_SUBTYPES.IDS]: 'yellow-300',
    [WALLET_SUBTYPES.JOB_HISTORY]: 'rose-300',
    [WALLET_SUBTYPES.LEARNING_HISTORY]: 'emerald-300',
    [WALLET_SUBTYPES.CURRENCIES]: 'cyan-200',
    [WALLET_SUBTYPES.SKILLS]: 'indigo-300',
    [WALLET_SUBTYPES.SOCIAL_BADGES]: 'cyan-200',
};
