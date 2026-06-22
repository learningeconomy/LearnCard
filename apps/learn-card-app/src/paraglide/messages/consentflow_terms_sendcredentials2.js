/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Terms_Sendcredentials2Inputs */

const en_consentflow_terms_sendcredentials2 = /** @type {(inputs: Consentflow_Terms_Sendcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`send credentials to you`)
};

const es_consentflow_terms_sendcredentials2 = /** @type {(inputs: Consentflow_Terms_Sendcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`enviarte credenciales`)
};

const fr_consentflow_terms_sendcredentials2 = /** @type {(inputs: Consentflow_Terms_Sendcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vous envoyer des justificatifs`)
};

const ar_consentflow_terms_sendcredentials2 = /** @type {(inputs: Consentflow_Terms_Sendcredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال بيانات اعتماد إليك`)
};

/**
* | output |
* | --- |
* | "send credentials to you" |
*
* @param {Consentflow_Terms_Sendcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_sendcredentials2 = /** @type {((inputs?: Consentflow_Terms_Sendcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Terms_Sendcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_terms_sendcredentials2(inputs)
	if (locale === "es") return es_consentflow_terms_sendcredentials2(inputs)
	if (locale === "fr") return fr_consentflow_terms_sendcredentials2(inputs)
	return ar_consentflow_terms_sendcredentials2(inputs)
});
export { consentflow_terms_sendcredentials2 as "consentFlow.terms.sendCredentials" }