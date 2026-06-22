/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestinsights2Inputs */

const en_aiinsights_requestinsights2 = /** @type {(inputs: Aiinsights_Requestinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Insights`)
};

const es_aiinsights_requestinsights2 = /** @type {(inputs: Aiinsights_Requestinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Insights`)
};

const fr_aiinsights_requestinsights2 = /** @type {(inputs: Aiinsights_Requestinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander des Insights`)
};

const ar_aiinsights_requestinsights2 = /** @type {(inputs: Aiinsights_Requestinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب رؤى`)
};

/**
* | output |
* | --- |
* | "Request Insights" |
*
* @param {Aiinsights_Requestinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestinsights2 = /** @type {((inputs?: Aiinsights_Requestinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestinsights2(inputs)
	if (locale === "es") return es_aiinsights_requestinsights2(inputs)
	if (locale === "fr") return fr_aiinsights_requestinsights2(inputs)
	return ar_aiinsights_requestinsights2(inputs)
});
export { aiinsights_requestinsights2 as "aiInsights.requestInsights" }