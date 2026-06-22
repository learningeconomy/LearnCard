/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Aisessions1Inputs */

const en_wallet_categories_aisessions1 = /** @type {(inputs: Wallet_Categories_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Sessions`)
};

const es_wallet_categories_aisessions1 = /** @type {(inputs: Wallet_Categories_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de IA`)
};

const fr_wallet_categories_aisessions1 = /** @type {(inputs: Wallet_Categories_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions IA`)
};

const ar_wallet_categories_aisessions1 = /** @type {(inputs: Wallet_Categories_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Sessions" |
*
* @param {Wallet_Categories_Aisessions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_aisessions1 = /** @type {((inputs?: Wallet_Categories_Aisessions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Aisessions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_aisessions1(inputs)
	if (locale === "es") return es_wallet_categories_aisessions1(inputs)
	if (locale === "fr") return fr_wallet_categories_aisessions1(inputs)
	return ar_wallet_categories_aisessions1(inputs)
});
export { wallet_categories_aisessions1 as "wallet.categories.aiSessions" }