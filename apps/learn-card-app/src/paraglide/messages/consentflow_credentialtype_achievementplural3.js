/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Achievementplural3Inputs */

const en_consentflow_credentialtype_achievementplural3 = /** @type {(inputs: Consentflow_Credentialtype_Achievementplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievements`)
};

const es_consentflow_credentialtype_achievementplural3 = /** @type {(inputs: Consentflow_Credentialtype_Achievementplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logros`)
};

const fr_consentflow_credentialtype_achievementplural3 = /** @type {(inputs: Consentflow_Credentialtype_Achievementplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisations`)
};

const ar_consentflow_credentialtype_achievementplural3 = /** @type {(inputs: Consentflow_Credentialtype_Achievementplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإنجازات`)
};

/**
* | output |
* | --- |
* | "Achievements" |
*
* @param {Consentflow_Credentialtype_Achievementplural3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_achievementplural3 = /** @type {((inputs?: Consentflow_Credentialtype_Achievementplural3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Achievementplural3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_achievementplural3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_achievementplural3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_achievementplural3(inputs)
	return ar_consentflow_credentialtype_achievementplural3(inputs)
});
export { consentflow_credentialtype_achievementplural3 as "consentFlow.credentialType.achievementPlural" }