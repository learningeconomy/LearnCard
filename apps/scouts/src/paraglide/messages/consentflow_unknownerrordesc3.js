/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Unknownerrordesc3Inputs */

const en_consentflow_unknownerrordesc3 = /** @type {(inputs: Consentflow_Unknownerrordesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was an unknown error. Please try again.`)
};

const es_consentflow_unknownerrordesc3 = /** @type {(inputs: Consentflow_Unknownerrordesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error desconocido. Por favor inténtalo de nuevo.`)
};

const fr_consentflow_unknownerrordesc3 = /** @type {(inputs: Consentflow_Unknownerrordesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur inconnue est survenue. Veuillez réessayer.`)
};

const ar_consentflow_unknownerrordesc3 = /** @type {(inputs: Consentflow_Unknownerrordesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was an unknown error. Please try again.`)
};

/**
* | output |
* | --- |
* | "There was an unknown error. Please try again." |
*
* @param {Consentflow_Unknownerrordesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_unknownerrordesc3 = /** @type {((inputs?: Consentflow_Unknownerrordesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Unknownerrordesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_unknownerrordesc3(inputs)
	if (locale === "es") return es_consentflow_unknownerrordesc3(inputs)
	if (locale === "fr") return fr_consentflow_unknownerrordesc3(inputs)
	return ar_consentflow_unknownerrordesc3(inputs)
});
export { consentflow_unknownerrordesc3 as "consentFlow.unknownErrorDesc" }