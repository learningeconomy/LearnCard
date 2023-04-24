import coinsGraphic from '../assets/images/walletcurrency.webp';
import idsGraphic from '../assets/images/walletids.webp';
import jobhistoryGraphic from '../assets/images/walletjobhistory.webp';
import learningHistoryGraphic from '../assets/images/walletlearninghistory.webp';
import skillsGraphic from '../assets/images/walletskills.webp';
import achievementsGraphic from '../assets/images/walletTrophy.webp';
import socialBadge from '../assets/images/social-badge.png';

import MiniTrophyIcon from '../assets/images/minitrophycolored.svg';
import MiniGradIcon from '../assets/images/minigradcapcolored.svg';
import MiniPuzzleIcon from '../assets/images/minipuzzlecolored.svg';
import { LCSubtypes, WalletCategoryTypes } from '../types';

export const TYPE_TO_MINI_ICON: any = {
    [LCSubtypes.course]: MiniGradIcon,
    [LCSubtypes.achievement]: MiniTrophyIcon,
    [LCSubtypes.skill]: MiniPuzzleIcon,
};

export const TYPE_TO_IMG_SRC = {
    [WalletCategoryTypes.achievements]: achievementsGraphic,
    [WalletCategoryTypes.ids]: idsGraphic,
    [WalletCategoryTypes.jobHistory]: jobhistoryGraphic,
    [WalletCategoryTypes.learningHistory]: learningHistoryGraphic,
    [WalletCategoryTypes.currency]: coinsGraphic,
    [WalletCategoryTypes.skills]: skillsGraphic,
    [WalletCategoryTypes.socialBadge]: socialBadge,
};

export const TYPE_TO_WALLET_COLOR = {
    [WalletCategoryTypes.achievements]: 'spice-300',
    [WalletCategoryTypes.ids]: 'yellow-300',
    [WalletCategoryTypes.jobHistory]: 'rose-300',
    [WalletCategoryTypes.learningHistory]: 'emerald-300',
    [WalletCategoryTypes.currency]: 'cyan-200',
    [WalletCategoryTypes.skills]: 'indigo-300',
    [WalletCategoryTypes.socialBadge]: 'cyan-200',
};

export const TYPE_TO_WALLET_LIGHT_COLOR = {
    [WalletCategoryTypes.achievements]: 'spice-200',
    [WalletCategoryTypes.ids]: 'yellow-200',
    [WalletCategoryTypes.jobHistory]: 'rose-200',
    [WalletCategoryTypes.learningHistory]: 'emerald-200',
    [WalletCategoryTypes.currency]: 'cyan-200',
    [WalletCategoryTypes.skills]: 'indigo-200',
    [WalletCategoryTypes.socialBadge]: 'cyan-200',
};

export const TYPE_TO_WALLET_DARK_COLOR = {
    [WalletCategoryTypes.achievements]: 'spice-500',
    [WalletCategoryTypes.ids]: 'yellow-400',
    [WalletCategoryTypes.jobHistory]: 'rose-400',
    [WalletCategoryTypes.learningHistory]: 'emerald-500',
    [WalletCategoryTypes.currency]: 'cyan-200',
    [WalletCategoryTypes.skills]: 'indigo-400',
    [WalletCategoryTypes.socialBadge]: 'cyan-700',
};
