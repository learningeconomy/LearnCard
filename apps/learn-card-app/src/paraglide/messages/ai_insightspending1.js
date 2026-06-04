/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Insightspending1Inputs */

const en_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights request already pending.`)
};

const es_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La solicitud de Insights ya está pendiente.`)
};

const de_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einblicke-Anfrage bereits ausstehend.`)
};

const ar_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الرؤى قيد الانتظار بالفعل.`)
};

const fr_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights est déjà en attente.`)
};

const ko_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`인사이트 요청이 이미 대기 중입니다.`)
};

/**
* | output |
* | --- |
* | "Insights request already pending." |
*
* @param {Ai_Insightspending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_insightspending1 = /** @type {((inputs?: Ai_Insightspending1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Insightspending1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_insightspending1(inputs)
	if (locale === "es") return es_ai_insightspending1(inputs)
	if (locale === "de") return de_ai_insightspending1(inputs)
	if (locale === "ar") return ar_ai_insightspending1(inputs)
	if (locale === "fr") return fr_ai_insightspending1(inputs)
	return ko_ai_insightspending1(inputs)
});
export { ai_insightspending1 as "ai.insightsPending" }