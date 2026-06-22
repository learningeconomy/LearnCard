/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Ai_Alreadypending1Inputs */

const en_toasts_ai_alreadypending1 = /** @type {(inputs: Toasts_Ai_Alreadypending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights request already pending.`)
};

const es_toasts_ai_alreadypending1 = /** @type {(inputs: Toasts_Ai_Alreadypending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La solicitud de Insights ya está pendiente.`)
};

const fr_toasts_ai_alreadypending1 = /** @type {(inputs: Toasts_Ai_Alreadypending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights est déjà en attente.`)
};

const ar_toasts_ai_alreadypending1 = /** @type {(inputs: Toasts_Ai_Alreadypending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الرؤى قيد الانتظار بالفعل.`)
};

/**
* | output |
* | --- |
* | "Insights request already pending." |
*
* @param {Toasts_Ai_Alreadypending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_ai_alreadypending1 = /** @type {((inputs?: Toasts_Ai_Alreadypending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Ai_Alreadypending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_ai_alreadypending1(inputs)
	if (locale === "es") return es_toasts_ai_alreadypending1(inputs)
	if (locale === "fr") return fr_toasts_ai_alreadypending1(inputs)
	return ar_toasts_ai_alreadypending1(inputs)
});
export { toasts_ai_alreadypending1 as "toasts.ai.alreadyPending" }