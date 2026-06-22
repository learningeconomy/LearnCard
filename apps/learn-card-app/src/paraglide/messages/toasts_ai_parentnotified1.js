/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Ai_Parentnotified1Inputs */

const en_toasts_ai_parentnotified1 = /** @type {(inputs: Toasts_Ai_Parentnotified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parent notified of share request!`)
};

const es_toasts_ai_parentnotified1 = /** @type {(inputs: Toasts_Ai_Parentnotified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Adulto notificado de la solicitud de compartir!`)
};

const fr_toasts_ai_parentnotified1 = /** @type {(inputs: Toasts_Ai_Parentnotified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adulte responsable notifié de la demande de partage !`)
};

const ar_toasts_ai_parentnotified1 = /** @type {(inputs: Toasts_Ai_Parentnotified1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`!تم إخطار ولي الأمر بطلب المشاركة`)
};

/**
* | output |
* | --- |
* | "Parent notified of share request!" |
*
* @param {Toasts_Ai_Parentnotified1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_ai_parentnotified1 = /** @type {((inputs?: Toasts_Ai_Parentnotified1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Ai_Parentnotified1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_ai_parentnotified1(inputs)
	if (locale === "es") return es_toasts_ai_parentnotified1(inputs)
	if (locale === "fr") return fr_toasts_ai_parentnotified1(inputs)
	return ar_toasts_ai_parentnotified1(inputs)
});
export { toasts_ai_parentnotified1 as "toasts.ai.parentNotified" }