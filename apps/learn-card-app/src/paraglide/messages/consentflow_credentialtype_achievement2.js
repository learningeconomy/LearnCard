/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Achievement2Inputs */

const en_consentflow_credentialtype_achievement2 = /** @type {(inputs: Consentflow_Credentialtype_Achievement2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievement`)
};

const es_consentflow_credentialtype_achievement2 = /** @type {(inputs: Consentflow_Credentialtype_Achievement2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logro`)
};

const fr_consentflow_credentialtype_achievement2 = /** @type {(inputs: Consentflow_Credentialtype_Achievement2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réalisation`)
};

const ar_consentflow_credentialtype_achievement2 = /** @type {(inputs: Consentflow_Credentialtype_Achievement2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنجاز`)
};

/**
* | output |
* | --- |
* | "Achievement" |
*
* @param {Consentflow_Credentialtype_Achievement2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_achievement2 = /** @type {((inputs?: Consentflow_Credentialtype_Achievement2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Achievement2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_achievement2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_achievement2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_achievement2(inputs)
	return ar_consentflow_credentialtype_achievement2(inputs)
});
export { consentflow_credentialtype_achievement2 as "consentFlow.credentialType.achievement" }