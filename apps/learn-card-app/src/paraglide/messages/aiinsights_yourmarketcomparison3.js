/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Yourmarketcomparison3Inputs */

const en_aiinsights_yourmarketcomparison3 = /** @type {(inputs: Aiinsights_Yourmarketcomparison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Market Comparison`)
};

const es_aiinsights_yourmarketcomparison3 = /** @type {(inputs: Aiinsights_Yourmarketcomparison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu comparación de mercado`)
};

const fr_aiinsights_yourmarketcomparison3 = /** @type {(inputs: Aiinsights_Yourmarketcomparison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre comparaison de marché`)
};

const ar_aiinsights_yourmarketcomparison3 = /** @type {(inputs: Aiinsights_Yourmarketcomparison3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقارنتك بالسوق`)
};

/**
* | output |
* | --- |
* | "Your Market Comparison" |
*
* @param {Aiinsights_Yourmarketcomparison3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_yourmarketcomparison3 = /** @type {((inputs?: Aiinsights_Yourmarketcomparison3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Yourmarketcomparison3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_yourmarketcomparison3(inputs)
	if (locale === "es") return es_aiinsights_yourmarketcomparison3(inputs)
	if (locale === "fr") return fr_aiinsights_yourmarketcomparison3(inputs)
	return ar_aiinsights_yourmarketcomparison3(inputs)
});
export { aiinsights_yourmarketcomparison3 as "aiInsights.yourMarketComparison" }