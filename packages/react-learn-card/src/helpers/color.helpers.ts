import { WalletCategoryTypes } from '../types';

export const getDarkBGColor = (type: WalletCategoryTypes) => {
    if (!type) return '';

    if (type === WalletCategoryTypes?.achievements) {
        return 'bg-orange-500';
    } else if (type === WalletCategoryTypes?.learningHistory) {
        return 'bg-emerald-500';
    } else if (type === WalletCategoryTypes?.skills) {
        return 'bg-violet-500';
    } else if (type === WalletCategoryTypes?.jobHistory) {
        return 'bg-blue-500';
    } else if (type === WalletCategoryTypes?.socialBadge) {
        return 'bg-cyan-500';
    } else if (type === WalletCategoryTypes?.relationships) {
        return 'bg-pink-500';
    } else if (type === WalletCategoryTypes?.accommodations) {
        return 'bg-amber-500';
    } else if (type === WalletCategoryTypes?.accomplishments) {
        return 'bg-lime-500';
    } else if (type === WalletCategoryTypes?.events) {
        return 'bg-fuchsia-500';
    } else if (type === WalletCategoryTypes?.membership) {
        return 'bg-teal-500';
    } else if (type === WalletCategoryTypes?.goals) {
        return 'bg-rose-500';
    } else if (type === WalletCategoryTypes?.ids) {
        return 'bg-yellow-500';
    } else if (type === WalletCategoryTypes?.currency) {
        return 'bg-cyan-500';
    }

    return 'bg-grayscale-900';
};
