/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Meritbadges1Inputs */

const en_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badges`)
};

const es_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignias al mérito`)
};

const de_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verdienstabzeichen`)
};

const ar_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارات الاستحقاق`)
};

const fr_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges de mérite`)
};

const ko_wallet_meritbadges1 = /** @type {(inputs: Wallet_Meritbadges1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공로 배지`)
};

/**
* | output |
* | --- |
* | "Merit Badges" |
*
* @param {Wallet_Meritbadges1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_meritbadges1 = /** @type {((inputs?: Wallet_Meritbadges1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Meritbadges1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_meritbadges1(inputs)
	if (locale === "es") return es_wallet_meritbadges1(inputs)
	if (locale === "de") return de_wallet_meritbadges1(inputs)
	if (locale === "ar") return ar_wallet_meritbadges1(inputs)
	if (locale === "fr") return fr_wallet_meritbadges1(inputs)
	return ko_wallet_meritbadges1(inputs)
});
export { wallet_meritbadges1 as "wallet.meritBadges" }