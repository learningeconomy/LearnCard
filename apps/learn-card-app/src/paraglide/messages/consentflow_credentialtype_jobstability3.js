/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Jobstability3Inputs */

const en_consentflow_credentialtype_jobstability3 = /** @type {(inputs: Consentflow_Credentialtype_Jobstability3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Stability`)
};

const es_consentflow_credentialtype_jobstability3 = /** @type {(inputs: Consentflow_Credentialtype_Jobstability3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estabilidad laboral`)
};

const fr_consentflow_credentialtype_jobstability3 = /** @type {(inputs: Consentflow_Credentialtype_Jobstability3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stabilité d'emploi`)
};

const ar_consentflow_credentialtype_jobstability3 = /** @type {(inputs: Consentflow_Credentialtype_Jobstability3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استقرار الوظيفة`)
};

/**
* | output |
* | --- |
* | "Job Stability" |
*
* @param {Consentflow_Credentialtype_Jobstability3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_jobstability3 = /** @type {((inputs?: Consentflow_Credentialtype_Jobstability3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Jobstability3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_jobstability3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_jobstability3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_jobstability3(inputs)
	return ar_consentflow_credentialtype_jobstability3(inputs)
});
export { consentflow_credentialtype_jobstability3 as "consentFlow.credentialType.jobStability" }