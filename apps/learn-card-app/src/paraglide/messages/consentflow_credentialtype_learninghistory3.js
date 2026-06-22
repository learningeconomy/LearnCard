/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Learninghistory3Inputs */

const en_consentflow_credentialtype_learninghistory3 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning History`)
};

const es_consentflow_credentialtype_learninghistory3 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de aprendizaje`)
};

const fr_consentflow_credentialtype_learninghistory3 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique d'apprentissage`)
};

const ar_consentflow_credentialtype_learninghistory3 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل التعلم`)
};

/**
* | output |
* | --- |
* | "Learning History" |
*
* @param {Consentflow_Credentialtype_Learninghistory3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_learninghistory3 = /** @type {((inputs?: Consentflow_Credentialtype_Learninghistory3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Learninghistory3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_learninghistory3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_learninghistory3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_learninghistory3(inputs)
	return ar_consentflow_credentialtype_learninghistory3(inputs)
});
export { consentflow_credentialtype_learninghistory3 as "consentFlow.credentialType.learningHistory" }