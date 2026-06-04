/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Insightsaccepted1Inputs */

const en_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights request already accepted.`)
};

const es_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La solicitud de Insights ya fue aceptada.`)
};

const de_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einblicke-Anfrage bereits akzeptiert.`)
};

const ar_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم قبول طلب الرؤى بالفعل.`)
};

const fr_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights a déjà été acceptée.`)
};

const ko_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`인사이트 요청이 이미 수락되었습니다.`)
};

/**
* | output |
* | --- |
* | "Insights request already accepted." |
*
* @param {Ai_Insightsaccepted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const ai_insightsaccepted1 = /** @type {((inputs?: Ai_Insightsaccepted1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Insightsaccepted1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_insightsaccepted1(inputs)
	if (locale === "es") return es_ai_insightsaccepted1(inputs)
	if (locale === "de") return de_ai_insightsaccepted1(inputs)
	if (locale === "ar") return ar_ai_insightsaccepted1(inputs)
	if (locale === "fr") return fr_ai_insightsaccepted1(inputs)
	return ko_ai_insightsaccepted1(inputs)
});
export { ai_insightsaccepted1 as "ai.insightsAccepted" }