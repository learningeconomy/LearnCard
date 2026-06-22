/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Ai_Alreadyaccepted1Inputs */

const en_toasts_ai_alreadyaccepted1 = /** @type {(inputs: Toasts_Ai_Alreadyaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insights request already accepted.`)
};

const es_toasts_ai_alreadyaccepted1 = /** @type {(inputs: Toasts_Ai_Alreadyaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La solicitud de Insights ya fue aceptada.`)
};

const fr_toasts_ai_alreadyaccepted1 = /** @type {(inputs: Toasts_Ai_Alreadyaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La demande d'Insights a déjà été acceptée.`)
};

const ar_toasts_ai_alreadyaccepted1 = /** @type {(inputs: Toasts_Ai_Alreadyaccepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب الرؤى مقبول بالفعل.`)
};

/**
* | output |
* | --- |
* | "Insights request already accepted." |
*
* @param {Toasts_Ai_Alreadyaccepted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_ai_alreadyaccepted1 = /** @type {((inputs?: Toasts_Ai_Alreadyaccepted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Ai_Alreadyaccepted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_ai_alreadyaccepted1(inputs)
	if (locale === "es") return es_toasts_ai_alreadyaccepted1(inputs)
	if (locale === "fr") return fr_toasts_ai_alreadyaccepted1(inputs)
	return ar_toasts_ai_alreadyaccepted1(inputs)
});
export { toasts_ai_alreadyaccepted1 as "toasts.ai.alreadyAccepted" }