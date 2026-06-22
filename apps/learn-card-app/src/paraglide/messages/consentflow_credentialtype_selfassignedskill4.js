/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Selfassignedskill4Inputs */

const en_consentflow_credentialtype_selfassignedskill4 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskill4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-Assigned Skill`)
};

const es_consentflow_credentialtype_selfassignedskill4 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskill4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad autoasignada`)
};

const fr_consentflow_credentialtype_selfassignedskill4 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskill4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence auto-attribuée`)
};

const ar_consentflow_credentialtype_selfassignedskill4 = /** @type {(inputs: Consentflow_Credentialtype_Selfassignedskill4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة مخصصة ذاتياً`)
};

/**
* | output |
* | --- |
* | "Self-Assigned Skill" |
*
* @param {Consentflow_Credentialtype_Selfassignedskill4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_selfassignedskill4 = /** @type {((inputs?: Consentflow_Credentialtype_Selfassignedskill4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Selfassignedskill4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_selfassignedskill4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_selfassignedskill4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_selfassignedskill4(inputs)
	return ar_consentflow_credentialtype_selfassignedskill4(inputs)
});
export { consentflow_credentialtype_selfassignedskill4 as "consentFlow.credentialType.selfAssignedSkill" }