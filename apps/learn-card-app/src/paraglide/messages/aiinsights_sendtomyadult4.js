/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Sendtomyadult4Inputs */

const en_aiinsights_sendtomyadult4 = /** @type {(inputs: Aiinsights_Sendtomyadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send to My Adult`)
};

const es_aiinsights_sendtomyadult4 = /** @type {(inputs: Aiinsights_Sendtomyadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar a mi adulto`)
};

const fr_aiinsights_sendtomyadult4 = /** @type {(inputs: Aiinsights_Sendtomyadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer à mon adulte responsable`)
};

const ar_aiinsights_sendtomyadult4 = /** @type {(inputs: Aiinsights_Sendtomyadult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال إلى ولي أمري`)
};

/**
* | output |
* | --- |
* | "Send to My Adult" |
*
* @param {Aiinsights_Sendtomyadult4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sendtomyadult4 = /** @type {((inputs?: Aiinsights_Sendtomyadult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Sendtomyadult4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_sendtomyadult4(inputs)
	if (locale === "es") return es_aiinsights_sendtomyadult4(inputs)
	if (locale === "fr") return fr_aiinsights_sendtomyadult4(inputs)
	return ar_aiinsights_sendtomyadult4(inputs)
});
export { aiinsights_sendtomyadult4 as "aiInsights.sendToMyAdult" }