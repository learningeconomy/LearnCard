/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Aiinsights2Inputs */

const en_wallet_categoriessingular_aiinsights2 = /** @type {(inputs: Wallet_Categoriessingular_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insight`)
};

const es_wallet_categoriessingular_aiinsights2 = /** @type {(inputs: Wallet_Categoriessingular_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Insight`)
};

const fr_wallet_categoriessingular_aiinsights2 = /** @type {(inputs: Wallet_Categoriessingular_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA Insight`)
};

const ar_wallet_categoriessingular_aiinsights2 = /** @type {(inputs: Wallet_Categoriessingular_Aiinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤية ذكاء اصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Insight" |
*
* @param {Wallet_Categoriessingular_Aiinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_aiinsights2 = /** @type {((inputs?: Wallet_Categoriessingular_Aiinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Aiinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_aiinsights2(inputs)
	if (locale === "es") return es_wallet_categoriessingular_aiinsights2(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_aiinsights2(inputs)
	return ar_wallet_categoriessingular_aiinsights2(inputs)
});
export { wallet_categoriessingular_aiinsights2 as "wallet.categoriesSingular.aiInsights" }