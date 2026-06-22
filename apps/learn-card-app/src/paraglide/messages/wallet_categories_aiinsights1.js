/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_Aiinsights1Inputs */

const en_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const es_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const fr_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const ar_wallet_categories_aiinsights1 = /** @type {(inputs: Wallet_Categories_Aiinsights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤى`)
};

/**
* | output |
* | --- |
* | "Insights" |
*
* @param {Wallet_Categories_Aiinsights1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_aiinsights1 = /** @type {((inputs?: Wallet_Categories_Aiinsights1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_Aiinsights1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_aiinsights1(inputs)
	if (locale === "es") return es_wallet_categories_aiinsights1(inputs)
	if (locale === "fr") return fr_wallet_categories_aiinsights1(inputs)
	return ar_wallet_categories_aiinsights1(inputs)
});
export { wallet_categories_aiinsights1 as "wallet.categories.aiInsights" }