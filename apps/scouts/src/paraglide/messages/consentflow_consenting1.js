/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Consenting1Inputs */

const en_consentflow_consenting1 = /** @type {(inputs: Consentflow_Consenting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consenting...`)
};

const es_consentflow_consenting1 = /** @type {(inputs: Consentflow_Consenting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dando consentimiento...`)
};

const fr_consentflow_consenting1 = /** @type {(inputs: Consentflow_Consenting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement en cours...`)
};

const ar_consentflow_consenting1 = /** @type {(inputs: Consentflow_Consenting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الموافقة...`)
};

/**
* | output |
* | --- |
* | "Consenting..." |
*
* @param {Consentflow_Consenting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_consenting1 = /** @type {((inputs?: Consentflow_Consenting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Consenting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_consenting1(inputs)
	if (locale === "es") return es_consentflow_consenting1(inputs)
	if (locale === "fr") return fr_consentflow_consenting1(inputs)
	return ar_consentflow_consenting1(inputs)
});
export { consentflow_consenting1 as "consentFlow.consenting" }