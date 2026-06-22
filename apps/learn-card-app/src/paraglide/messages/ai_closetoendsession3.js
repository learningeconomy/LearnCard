/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Ai_Closetoendsession3Inputs */

const en_ai_closetoendsession3 = /** @type {(inputs: Ai_Closetoendsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close to End Session`)
};

const es_ai_closetoendsession3 = /** @type {(inputs: Ai_Closetoendsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cerrar para finalizar la sesión`)
};

const fr_ai_closetoendsession3 = /** @type {(inputs: Ai_Closetoendsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer pour terminer la session`)
};

const ar_ai_closetoendsession3 = /** @type {(inputs: Ai_Closetoendsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إغلاق لإنهاء الجلسة`)
};

/**
* | output |
* | --- |
* | "Close to End Session" |
*
* @param {Ai_Closetoendsession3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const ai_closetoendsession3 = /** @type {((inputs?: Ai_Closetoendsession3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Ai_Closetoendsession3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_ai_closetoendsession3(inputs)
	if (locale === "es") return es_ai_closetoendsession3(inputs)
	if (locale === "fr") return fr_ai_closetoendsession3(inputs)
	return ar_ai_closetoendsession3(inputs)
});
export { ai_closetoendsession3 as "ai.closeToEndSession" }