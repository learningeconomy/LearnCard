/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Socialbadges1Inputs */

const en_wallet_categories_socialbadges1 = /** @type {(inputs: Wallet_Categories_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boosts`)
};

const es_wallet_categories_socialbadges1 = /** @type {(inputs: Wallet_Categories_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias`)
};

const de_wallet_categories_socialbadges1 = /** @type {(inputs: Wallet_Categories_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abzeichen`)
};

const ar_wallet_categories_socialbadges1 = /** @type {(inputs: Wallet_Categories_Socialbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشارات`)
};

/**
* | output |
* | --- |
* | "Boosts" |
*
* @param {Wallet_Categories_Socialbadges1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_socialbadges1 = /** @type {((inputs?: Wallet_Categories_Socialbadges1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Socialbadges1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_socialbadges1(inputs)
	if (locale === "es") return es_wallet_categories_socialbadges1(inputs)
	if (locale === "de") return de_wallet_categories_socialbadges1(inputs)
	return ar_wallet_categories_socialbadges1(inputs)
});
export { wallet_categories_socialbadges1 as "wallet.categories.socialBadges" }