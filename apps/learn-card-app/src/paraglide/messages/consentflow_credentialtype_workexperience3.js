/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Workexperience3Inputs */

const en_consentflow_credentialtype_workexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Workexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Experience`)
};

const es_consentflow_credentialtype_workexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Workexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia laboral`)
};

const fr_consentflow_credentialtype_workexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Workexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience de travail`)
};

const ar_consentflow_credentialtype_workexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Workexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة العمل`)
};

/**
* | output |
* | --- |
* | "Work Experience" |
*
* @param {Consentflow_Credentialtype_Workexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_workexperience3 = /** @type {((inputs?: Consentflow_Credentialtype_Workexperience3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Workexperience3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_workexperience3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_workexperience3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_workexperience3(inputs)
	return ar_consentflow_credentialtype_workexperience3(inputs)
});
export { consentflow_credentialtype_workexperience3 as "consentFlow.credentialType.workExperience" }