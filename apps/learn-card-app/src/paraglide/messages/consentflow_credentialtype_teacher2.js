/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Teacher2Inputs */

const en_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teacher`)
};

const es_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profesor`)
};

const de_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lehrer`)
};

const ar_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معلم`)
};

const fr_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enseignant`)
};

const ko_consentflow_credentialtype_teacher2 = /** @type {(inputs: Consentflow_Credentialtype_Teacher2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`교사`)
};

/**
* | output |
* | --- |
* | "Teacher" |
*
* @param {Consentflow_Credentialtype_Teacher2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_teacher2 = /** @type {((inputs?: Consentflow_Credentialtype_Teacher2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Teacher2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_teacher2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_teacher2(inputs)
	if (locale === "de") return de_consentflow_credentialtype_teacher2(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_teacher2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_teacher2(inputs)
	return ko_consentflow_credentialtype_teacher2(inputs)
});
export { consentflow_credentialtype_teacher2 as "consentFlow.credentialType.teacher" }