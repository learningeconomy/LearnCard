/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Insights1Inputs */

const en_aiinsights_insights1 = /** @type {(inputs: Aiinsights_Insights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const es_aiinsights_insights1 = /** @type {(inputs: Aiinsights_Insights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const fr_aiinsights_insights1 = /** @type {(inputs: Aiinsights_Insights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights`)
};

const ar_aiinsights_insights1 = /** @type {(inputs: Aiinsights_Insights1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الرؤى`)
};

/**
* | output |
* | --- |
* | "Insights" |
*
* @param {Aiinsights_Insights1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_insights1 = /** @type {((inputs?: Aiinsights_Insights1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Insights1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_insights1(inputs)
	if (locale === "es") return es_aiinsights_insights1(inputs)
	if (locale === "fr") return fr_aiinsights_insights1(inputs)
	return ar_aiinsights_insights1(inputs)
});
export { aiinsights_insights1 as "aiInsights.insights" }