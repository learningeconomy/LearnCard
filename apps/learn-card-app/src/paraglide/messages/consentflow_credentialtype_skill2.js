/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Skill2Inputs */

const en_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill`)
};

const es_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad`)
};

const de_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fähigkeit`)
};

const ar_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة`)
};

const fr_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence`)
};

const ko_consentflow_credentialtype_skill2 = /** @type {(inputs: Consentflow_Credentialtype_Skill2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술`)
};

/**
* | output |
* | --- |
* | "Skill" |
*
* @param {Consentflow_Credentialtype_Skill2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_skill2 = /** @type {((inputs?: Consentflow_Credentialtype_Skill2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Skill2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_skill2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_skill2(inputs)
	if (locale === "de") return de_consentflow_credentialtype_skill2(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_skill2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_skill2(inputs)
	return ko_consentflow_credentialtype_skill2(inputs)
});
export { consentflow_credentialtype_skill2 as "consentFlow.credentialType.skill" }