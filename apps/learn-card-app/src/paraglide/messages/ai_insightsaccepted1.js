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

const fr_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights a déjà été acceptée.`)
};

const ar_ai_insightsaccepted1 = /** @type {(inputs: Ai_Insightsaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم قبول طلب الرؤى بالفعل.`)
};

/**
* | output |
* | --- |
* | "Insights request already accepted." |
*
* @param {Ai_Insightsaccepted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_insightsaccepted1 = /** @type {((inputs?: Ai_Insightsaccepted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Insightsaccepted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_insightsaccepted1(inputs)
	if (locale === "es") return es_ai_insightsaccepted1(inputs)
	if (locale === "fr") return fr_ai_insightsaccepted1(inputs)
	return ar_ai_insightsaccepted1(inputs)
});
export { ai_insightsaccepted1 as "ai.insightsAccepted" }