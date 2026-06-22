/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestaccepted2Inputs */

const en_aiinsights_requestaccepted2 = /** @type {(inputs: Aiinsights_Requestaccepted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Accepted`)
};

const es_aiinsights_requestaccepted2 = /** @type {(inputs: Aiinsights_Requestaccepted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud aceptada`)
};

const fr_aiinsights_requestaccepted2 = /** @type {(inputs: Aiinsights_Requestaccepted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande acceptée`)
};

const ar_aiinsights_requestaccepted2 = /** @type {(inputs: Aiinsights_Requestaccepted2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الطلب مقبول`)
};

/**
* | output |
* | --- |
* | "Request Accepted" |
*
* @param {Aiinsights_Requestaccepted2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestaccepted2 = /** @type {((inputs?: Aiinsights_Requestaccepted2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestaccepted2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestaccepted2(inputs)
	if (locale === "es") return es_aiinsights_requestaccepted2(inputs)
	if (locale === "fr") return fr_aiinsights_requestaccepted2(inputs)
	return ar_aiinsights_requestaccepted2(inputs)
});
export { aiinsights_requestaccepted2 as "aiInsights.requestAccepted" }