/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Markethigh2Inputs */

const en_aiinsights_markethigh2 = /** @type {(inputs: Aiinsights_Markethigh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MARKET HIGH`)
};

const es_aiinsights_markethigh2 = /** @type {(inputs: Aiinsights_Markethigh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MÁXIMO DEL MERCADO`)
};

const fr_aiinsights_markethigh2 = /** @type {(inputs: Aiinsights_Markethigh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MAXIMUM DU MARCHÉ`)
};

const ar_aiinsights_markethigh2 = /** @type {(inputs: Aiinsights_Markethigh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحد الأقصى للسوق`)
};

/**
* | output |
* | --- |
* | "MARKET HIGH" |
*
* @param {Aiinsights_Markethigh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_markethigh2 = /** @type {((inputs?: Aiinsights_Markethigh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Markethigh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_markethigh2(inputs)
	if (locale === "es") return es_aiinsights_markethigh2(inputs)
	if (locale === "fr") return fr_aiinsights_markethigh2(inputs)
	return ar_aiinsights_markethigh2(inputs)
});
export { aiinsights_markethigh2 as "aiInsights.marketHigh" }