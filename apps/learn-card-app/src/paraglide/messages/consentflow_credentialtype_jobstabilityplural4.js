/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Jobstabilityplural4Inputs */

const en_consentflow_credentialtype_jobstabilityplural4 = /** @type {(inputs: Consentflow_Credentialtype_Jobstabilityplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Job Stability`)
};

const es_consentflow_credentialtype_jobstabilityplural4 = /** @type {(inputs: Consentflow_Credentialtype_Jobstabilityplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estabilidad laboral`)
};

const fr_consentflow_credentialtype_jobstabilityplural4 = /** @type {(inputs: Consentflow_Credentialtype_Jobstabilityplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stabilité d'emploi`)
};

const ar_consentflow_credentialtype_jobstabilityplural4 = /** @type {(inputs: Consentflow_Credentialtype_Jobstabilityplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استقرار الوظيفة`)
};

/**
* | output |
* | --- |
* | "Job Stability" |
*
* @param {Consentflow_Credentialtype_Jobstabilityplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_jobstabilityplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Jobstabilityplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Jobstabilityplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_jobstabilityplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_jobstabilityplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_jobstabilityplural4(inputs)
	return ar_consentflow_credentialtype_jobstabilityplural4(inputs)
});
export { consentflow_credentialtype_jobstabilityplural4 as "consentFlow.credentialType.jobStabilityPlural" }