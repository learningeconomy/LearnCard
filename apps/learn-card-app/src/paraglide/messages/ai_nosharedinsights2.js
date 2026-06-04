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

const de_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine geteilten Einblicke`)
};

const ar_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد رؤى مشتركة`)
};

const fr_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Insight partagé`)
};

const ko_ai_nosharedinsights2 = /** @type {(inputs: Ai_Nosharedinsights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공유된 인사이트 없음`)
};

/**
* | output |
* | --- |
* | "No Shared Insights" |
*
* @param {Ai_Nosharedinsights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_nosharedinsights2 = /** @type {((inputs?: Ai_Nosharedinsights2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Nosharedinsights2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_nosharedinsights2(inputs)
	if (locale === "es") return es_ai_nosharedinsights2(inputs)
	if (locale === "de") return de_ai_nosharedinsights2(inputs)
	if (locale === "ar") return ar_ai_nosharedinsights2(inputs)
	if (locale === "fr") return fr_ai_nosharedinsights2(inputs)
	return ko_ai_nosharedinsights2(inputs)
});
export { ai_nosharedinsights2 as "ai.noSharedInsights" }