/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Unknownerror2Inputs */

const en_consentflow_unknownerror2 = /** @type {(inputs: Consentflow_Unknownerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown Error`)
};

const es_consentflow_unknownerror2 = /** @type {(inputs: Consentflow_Unknownerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error Desconocido`)
};

const fr_consentflow_unknownerror2 = /** @type {(inputs: Consentflow_Unknownerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur inconnue`)
};

const ar_consentflow_unknownerror2 = /** @type {(inputs: Consentflow_Unknownerror2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown Error`)
};

/**
* | output |
* | --- |
* | "Unknown Error" |
*
* @param {Consentflow_Unknownerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_unknownerror2 = /** @type {((inputs?: Consentflow_Unknownerror2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Unknownerror2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_unknownerror2(inputs)
	if (locale === "es") return es_consentflow_unknownerror2(inputs)
	if (locale === "fr") return fr_consentflow_unknownerror2(inputs)
	return ar_consentflow_unknownerror2(inputs)
});
export { consentflow_unknownerror2 as "consentFlow.unknownError" }