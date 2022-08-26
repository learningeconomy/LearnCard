import coinsGraphic from '../../assets/images/walletcurrency.png';
import idsGraphic from '../../assets/images/walletids.png';
import jobhistoryGraphic from '../../assets/images/walletjobhistory.png';
import learningHistoryGraphic from '../../assets/images/walletlearninghistory.png';
import skillsGraphic from '../../assets/images/walletskills.png';
import achievementsGraphic from '../../assets/images/walletTrophy.png';

export const WALLET_SUBTYPES = {
    ACHIEVEMENTS: 'achievements',
    IDS: 'ids',
    JOB_HISTORY: 'jobHistory',
    CURRENCIES: 'currency',
    LEARNING_HISTORY: 'learningHistory',
    SKILLS: 'skills',
};

export const TYPE_TO_IMG_SRC = {
    [WALLET_SUBTYPES.ACHIEVEMENTS]: achievementsGraphic,
    [WALLET_SUBTYPES.IDS]: idsGraphic,
    [WALLET_SUBTYPES.JOB_HISTORY]: jobhistoryGraphic,
    [WALLET_SUBTYPES.LEARNING_HISTORY]: learningHistoryGraphic,
    [WALLET_SUBTYPES.CURRENCIES]: coinsGraphic,
    [WALLET_SUBTYPES.SKILLS]: skillsGraphic,
};

export const TYPE_TO_WALLET_COLOR = {
    [WALLET_SUBTYPES.ACHIEVEMENTS]: 'spice-300',
    [WALLET_SUBTYPES.IDS]: 'yellow-300',
    [WALLET_SUBTYPES.JOB_HISTORY]: 'rose-300',
    [WALLET_SUBTYPES.LEARNING_HISTORY]: 'emerald-300',
    [WALLET_SUBTYPES.CURRENCIES]: 'cyan-200',
    [WALLET_SUBTYPES.SKILLS]: 'indigo-300',
};
