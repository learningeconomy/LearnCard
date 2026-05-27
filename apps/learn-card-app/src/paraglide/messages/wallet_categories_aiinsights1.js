/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Aiinsights1Inputs */

const en_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insights`)
};

const es_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Perspectivas IA`)
};

const de_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`KI-Einblicke`)
};

const ar_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Insights" |
*
* @param {Wallet_Categories_Aiinsights1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_aiinsights1 = /** @type {((inputs?: Wallet_Categories_Aiinsights1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Aiinsights1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_aiinsights1(inputs)
	if (locale === "es") return es_wallet_categories_aiinsights1(inputs)
	if (locale === "de") return de_wallet_categories_aiinsights1(inputs)
	return ar_wallet_categories_aiinsights1(inputs)
});
export { wallet_categories_aiinsights1 as "wallet.categories.aiInsights" }