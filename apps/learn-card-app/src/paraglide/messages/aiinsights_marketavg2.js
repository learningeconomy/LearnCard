/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Marketavg2Inputs */

const en_aiinsights_marketavg2 = /** @type {(inputs: Aiinsights_Marketavg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MARKET AVG`)
};

const es_aiinsights_marketavg2 = /** @type {(inputs: Aiinsights_Marketavg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`PROMEDIO DEL MERCADO`)
};

const fr_aiinsights_marketavg2 = /** @type {(inputs: Aiinsights_Marketavg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MOYENNE DU MARCHÉ`)
};

const ar_aiinsights_marketavg2 = /** @type {(inputs: Aiinsights_Marketavg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متوسط السوق`)
};

/**
* | output |
* | --- |
* | "MARKET AVG" |
*
* @param {Aiinsights_Marketavg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_marketavg2 = /** @type {((inputs?: Aiinsights_Marketavg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Marketavg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_marketavg2(inputs)
	if (locale === "es") return es_aiinsights_marketavg2(inputs)
	if (locale === "fr") return fr_aiinsights_marketavg2(inputs)
	return ar_aiinsights_marketavg2(inputs)
});
export { aiinsights_marketavg2 as "aiInsights.marketAvg" }