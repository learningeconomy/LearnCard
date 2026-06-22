/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Learninghistoryplural4Inputs */

const en_consentflow_credentialtype_learninghistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning History`)
};

const es_consentflow_credentialtype_learninghistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de aprendizaje`)
};

const fr_consentflow_credentialtype_learninghistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique d'apprentissage`)
};

const ar_consentflow_credentialtype_learninghistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Learninghistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل التعلم`)
};

/**
* | output |
* | --- |
* | "Learning History" |
*
* @param {Consentflow_Credentialtype_Learninghistoryplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_learninghistoryplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Learninghistoryplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Learninghistoryplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_learninghistoryplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_learninghistoryplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_learninghistoryplural4(inputs)
	return ar_consentflow_credentialtype_learninghistoryplural4(inputs)
});
export { consentflow_credentialtype_learninghistoryplural4 as "consentFlow.credentialType.learningHistoryPlural" }