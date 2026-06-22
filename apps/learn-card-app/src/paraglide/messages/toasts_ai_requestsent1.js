/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Ai_Requestsent1Inputs */

const en_toasts_ai_requestsent1 = /** @type {(inputs: Toasts_Ai_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Insights request sent!`)
};

const es_toasts_ai_requestsent1 = /** @type {(inputs: Toasts_Ai_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Solicitud de Insights de IA enviada!`)
};

const fr_toasts_ai_requestsent1 = /** @type {(inputs: Toasts_Ai_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande d'Insights IA envoyée !`)
};

const ar_toasts_ai_requestsent1 = /** @type {(inputs: Toasts_Ai_Requestsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!تم إرسال طلب رؤى الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Insights request sent!" |
*
* @param {Toasts_Ai_Requestsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_ai_requestsent1 = /** @type {((inputs?: Toasts_Ai_Requestsent1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Ai_Requestsent1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_ai_requestsent1(inputs)
	if (locale === "es") return es_toasts_ai_requestsent1(inputs)
	if (locale === "fr") return fr_toasts_ai_requestsent1(inputs)
	return ar_toasts_ai_requestsent1(inputs)
});
export { toasts_ai_requestsent1 as "toasts.ai.requestSent" }