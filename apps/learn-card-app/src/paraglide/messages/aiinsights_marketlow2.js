/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Marketlow2Inputs */

const en_aiinsights_marketlow2 = /** @type {(inputs: Aiinsights_Marketlow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MARKET LOW`)
};

const es_aiinsights_marketlow2 = /** @type {(inputs: Aiinsights_Marketlow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MÍNIMO DEL MERCADO`)
};

const fr_aiinsights_marketlow2 = /** @type {(inputs: Aiinsights_Marketlow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MINIMUM DU MARCHÉ`)
};

const ar_aiinsights_marketlow2 = /** @type {(inputs: Aiinsights_Marketlow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحد الأدنى للسوق`)
};

/**
* | output |
* | --- |
* | "MARKET LOW" |
*
* @param {Aiinsights_Marketlow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_marketlow2 = /** @type {((inputs?: Aiinsights_Marketlow2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Marketlow2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_marketlow2(inputs)
	if (locale === "es") return es_aiinsights_marketlow2(inputs)
	if (locale === "fr") return fr_aiinsights_marketlow2(inputs)
	return ar_aiinsights_marketlow2(inputs)
});
export { aiinsights_marketlow2 as "aiInsights.marketLow" }