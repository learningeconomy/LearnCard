/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_AchievementsInputs */

const en_wallet_categories_achievements = /** @type {(inputs: Wallet_Categories_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_wallet_categories_achievements = /** @type {(inputs: Wallet_Categories_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const de_wallet_categories_achievements = /** @type {(inputs: Wallet_Categories_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erfolge`)
};

const ar_wallet_categories_achievements = /** @type {(inputs: Wallet_Categories_AchievementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Wallet_Categories_AchievementsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_achievements = /** @type {((inputs?: Wallet_Categories_AchievementsInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_AchievementsInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_achievements(inputs)
	if (locale === "es") return es_wallet_categories_achievements(inputs)
	if (locale === "de") return de_wallet_categories_achievements(inputs)
	return ar_wallet_categories_achievements(inputs)
});
export { wallet_categories_achievements as "wallet.categories.achievements" }