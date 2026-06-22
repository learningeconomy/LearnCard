/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Workexperienceplural4Inputs */

const en_consentflow_credentialtype_workexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Experiences`)
};

const es_consentflow_credentialtype_workexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencias laborales`)
};

const fr_consentflow_credentialtype_workexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expériences de travail`)
};

const ar_consentflow_credentialtype_workexperienceplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workexperienceplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرات العمل`)
};

/**
* | output |
* | --- |
* | "Work Experiences" |
*
* @param {Consentflow_Credentialtype_Workexperienceplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_workexperienceplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Workexperienceplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Workexperienceplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_workexperienceplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_workexperienceplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_workexperienceplural4(inputs)
	return ar_consentflow_credentialtype_workexperienceplural4(inputs)
});
export { consentflow_credentialtype_workexperienceplural4 as "consentFlow.credentialType.workExperiencePlural" }