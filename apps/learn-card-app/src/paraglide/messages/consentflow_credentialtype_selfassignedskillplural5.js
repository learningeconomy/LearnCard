/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Selfassignedskillplural5Inputs */

const en_consentflow_credentialtype_selfassignedskillplural5 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskillplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-Assigned Skills`)
};

const es_consentflow_credentialtype_selfassignedskillplural5 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskillplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidades autoasignadas`)
};

const fr_consentflow_credentialtype_selfassignedskillplural5 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskillplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences auto-attribuées`)
};

const ar_consentflow_credentialtype_selfassignedskillplural5 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskillplural5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارات مخصصة ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self-Assigned Skills" |
*
* @param {Consentflow_Credentialtype_Selfassignedskillplural5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_selfassignedskillplural5 = /** @type {((inputs?: Consentflow_Credentialtype_Selfassignedskillplural5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Selfassignedskillplural5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_selfassignedskillplural5(inputs)
	if (locale === "es") return es_consentflow_credentialtype_selfassignedskillplural5(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_selfassignedskillplural5(inputs)
	return ar_consentflow_credentialtype_selfassignedskillplural5(inputs)
});
export { consentflow_credentialtype_selfassignedskillplural5 as "consentFlow.credentialType.selfAssignedSkillPlural" }