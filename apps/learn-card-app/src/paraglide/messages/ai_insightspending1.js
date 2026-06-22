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

const fr_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights est déjà en attente.`)
};

const ar_ai_insightspending1 = /** @type {(inputs: Ai_Insightspending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الرؤى قيد الانتظار بالفعل.`)
};

/**
* | output |
* | --- |
* | "Insights request already pending." |
*
* @param {Ai_Insightspending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_insightspending1 = /** @type {((inputs?: Ai_Insightspending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Insightspending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_insightspending1(inputs)
	if (locale === "es") return es_ai_insightspending1(inputs)
	if (locale === "fr") return fr_ai_insightspending1(inputs)
	return ar_ai_insightspending1(inputs)
});
export { ai_insightspending1 as "ai.insightsPending" }