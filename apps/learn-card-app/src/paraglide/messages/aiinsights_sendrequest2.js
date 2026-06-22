/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Sendrequest2Inputs */

const en_aiinsights_sendrequest2 = /** @type {(inputs: Aiinsights_Sendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Request`)
};

const es_aiinsights_sendrequest2 = /** @type {(inputs: Aiinsights_Sendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar solicitud`)
};

const fr_aiinsights_sendrequest2 = /** @type {(inputs: Aiinsights_Sendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la demande`)
};

const ar_aiinsights_sendrequest2 = /** @type {(inputs: Aiinsights_Sendrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الطلب`)
};

/**
* | output |
* | --- |
* | "Send Request" |
*
* @param {Aiinsights_Sendrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_sendrequest2 = /** @type {((inputs?: Aiinsights_Sendrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Sendrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_sendrequest2(inputs)
	if (locale === "es") return es_aiinsights_sendrequest2(inputs)
	if (locale === "fr") return fr_aiinsights_sendrequest2(inputs)
	return ar_aiinsights_sendrequest2(inputs)
});
export { aiinsights_sendrequest2 as "aiInsights.sendRequest" }