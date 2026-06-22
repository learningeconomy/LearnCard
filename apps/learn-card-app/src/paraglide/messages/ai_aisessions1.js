/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Aisessions1Inputs */

const en_ai_aisessions1 = /** @type {(inputs: Ai_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Sessions`)
};

const es_ai_aisessions1 = /** @type {(inputs: Ai_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de IA`)
};

const fr_ai_aisessions1 = /** @type {(inputs: Ai_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions IA`)
};

const ar_ai_aisessions1 = /** @type {(inputs: Ai_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Sessions" |
*
* @param {Ai_Aisessions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_aisessions1 = /** @type {((inputs?: Ai_Aisessions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Aisessions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_aisessions1(inputs)
	if (locale === "es") return es_ai_aisessions1(inputs)
	if (locale === "fr") return fr_ai_aisessions1(inputs)
	return ar_ai_aisessions1(inputs)
});
export { ai_aisessions1 as "ai.aiSessions" }