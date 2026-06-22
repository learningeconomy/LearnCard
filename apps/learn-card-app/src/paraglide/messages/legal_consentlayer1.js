/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Consentlayer1Inputs */

const en_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Layer`)
};

const es_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Capa de consentimiento`)
};

const fr_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Couche de consentement`)
};

const ar_legal_consentlayer1 = /** @type {(inputs: Legal_Consentlayer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طبقة الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Layer" |
*
* @param {Legal_Consentlayer1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_consentlayer1 = /** @type {((inputs?: Legal_Consentlayer1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Consentlayer1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_consentlayer1(inputs)
	if (locale === "es") return es_legal_consentlayer1(inputs)
	if (locale === "fr") return fr_legal_consentlayer1(inputs)
	return ar_legal_consentlayer1(inputs)
});
export { legal_consentlayer1 as "legal.consentLayer" }