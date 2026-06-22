/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Customduration2Inputs */

const en_consentflow_customduration2 = /** @type {(inputs: Consentflow_Customduration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Duration`)
};

const es_consentflow_customduration2 = /** @type {(inputs: Consentflow_Customduration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duración personalizada`)
};

const fr_consentflow_customduration2 = /** @type {(inputs: Consentflow_Customduration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Durée personnalisée`)
};

const ar_consentflow_customduration2 = /** @type {(inputs: Consentflow_Customduration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مدة مخصصة`)
};

/**
* | output |
* | --- |
* | "Custom Duration" |
*
* @param {Consentflow_Customduration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_customduration2 = /** @type {((inputs?: Consentflow_Customduration2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Customduration2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_customduration2(inputs)
	if (locale === "es") return es_consentflow_customduration2(inputs)
	if (locale === "fr") return fr_consentflow_customduration2(inputs)
	return ar_consentflow_customduration2(inputs)
});
export { consentflow_customduration2 as "consentFlow.customDuration" }