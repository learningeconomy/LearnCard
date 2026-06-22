/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Nosharedinsights2Inputs */

const en_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Shared Insights`)
};

const es_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin Insights compartidos`)
};

const fr_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Insight partagé`)
};

const ar_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رؤى مشتركة`)
};

/**
* | output |
* | --- |
* | "No Shared Insights" |
*
* @param {Ai_Nosharedinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_nosharedinsights2 = /** @type {((inputs?: Ai_Nosharedinsights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosharedinsights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosharedinsights2(inputs)
	if (locale === "es") return es_ai_nosharedinsights2(inputs)
	if (locale === "fr") return fr_ai_nosharedinsights2(inputs)
	return ar_ai_nosharedinsights2(inputs)
});
export { ai_nosharedinsights2 as "ai.noSharedInsights" }