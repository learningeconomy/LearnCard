/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Sending1Inputs */

const en_aiinsights_sending1 = /** @type {(inputs: Aiinsights_Sending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending...`)
};

const es_aiinsights_sending1 = /** @type {(inputs: Aiinsights_Sending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando...`)
};

const fr_aiinsights_sending1 = /** @type {(inputs: Aiinsights_Sending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi en cours...`)
};

const ar_aiinsights_sending1 = /** @type {(inputs: Aiinsights_Sending1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري الإرسال`)
};

/**
* | output |
* | --- |
* | "Sending..." |
*
* @param {Aiinsights_Sending1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sending1 = /** @type {((inputs?: Aiinsights_Sending1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Sending1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_sending1(inputs)
	if (locale === "es") return es_aiinsights_sending1(inputs)
	if (locale === "fr") return fr_aiinsights_sending1(inputs)
	return ar_aiinsights_sending1(inputs)
});
export { aiinsights_sending1 as "aiInsights.sending" }