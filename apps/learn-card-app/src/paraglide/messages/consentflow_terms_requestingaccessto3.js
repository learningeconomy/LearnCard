/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Terms_Requestingaccessto3Inputs */

const en_consentflow_terms_requestingaccessto3 = /** @type {(inputs: Consentflow_Terms_Requestingaccessto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`is requesting access to`)
};

const es_consentflow_terms_requestingaccessto3 = /** @type {(inputs: Consentflow_Terms_Requestingaccessto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`está solicitando acceso para`)
};

const fr_consentflow_terms_requestingaccessto3 = /** @type {(inputs: Consentflow_Terms_Requestingaccessto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`demande l'accès pour`)
};

const ar_consentflow_terms_requestingaccessto3 = /** @type {(inputs: Consentflow_Terms_Requestingaccessto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يطلب الوصول إلى`)
};

/**
* | output |
* | --- |
* | "is requesting access to" |
*
* @param {Consentflow_Terms_Requestingaccessto3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_terms_requestingaccessto3 = /** @type {((inputs?: Consentflow_Terms_Requestingaccessto3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Terms_Requestingaccessto3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_terms_requestingaccessto3(inputs)
	if (locale === "es") return es_consentflow_terms_requestingaccessto3(inputs)
	if (locale === "fr") return fr_consentflow_terms_requestingaccessto3(inputs)
	return ar_consentflow_terms_requestingaccessto3(inputs)
});
export { consentflow_terms_requestingaccessto3 as "consentFlow.terms.requestingAccessTo" }