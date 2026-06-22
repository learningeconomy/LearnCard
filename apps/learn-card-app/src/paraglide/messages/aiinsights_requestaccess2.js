/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestaccess2Inputs */

const en_aiinsights_requestaccess2 = /** @type {(inputs: Aiinsights_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Insights`)
};

const es_aiinsights_requestaccess2 = /** @type {(inputs: Aiinsights_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Insights`)
};

const fr_aiinsights_requestaccess2 = /** @type {(inputs: Aiinsights_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander des Insights`)
};

const ar_aiinsights_requestaccess2 = /** @type {(inputs: Aiinsights_Requestaccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب رؤى`)
};

/**
* | output |
* | --- |
* | "Request Insights" |
*
* @param {Aiinsights_Requestaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestaccess2 = /** @type {((inputs?: Aiinsights_Requestaccess2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestaccess2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestaccess2(inputs)
	if (locale === "es") return es_aiinsights_requestaccess2(inputs)
	if (locale === "fr") return fr_aiinsights_requestaccess2(inputs)
	return ar_aiinsights_requestaccess2(inputs)
});
export { aiinsights_requestaccess2 as "aiInsights.requestAccess" }