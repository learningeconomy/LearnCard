/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Roleexperience3Inputs */

const en_consentflow_credentialtype_roleexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Role Experience`)
};

const es_consentflow_credentialtype_roleexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia en el rol`)
};

const fr_consentflow_credentialtype_roleexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience de rôle`)
};

const ar_consentflow_credentialtype_roleexperience3 = /** @type {(inputs: Consentflow_Credentialtype_Roleexperience3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبرة في الدور`)
};

/**
* | output |
* | --- |
* | "Role Experience" |
*
* @param {Consentflow_Credentialtype_Roleexperience3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_roleexperience3 = /** @type {((inputs?: Consentflow_Credentialtype_Roleexperience3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Roleexperience3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_roleexperience3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_roleexperience3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_roleexperience3(inputs)
	return ar_consentflow_credentialtype_roleexperience3(inputs)
});
export { consentflow_credentialtype_roleexperience3 as "consentFlow.credentialType.roleExperience" }