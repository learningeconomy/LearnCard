/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Socialbadge3Inputs */

const en_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

const es_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia social`)
};

const de_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soziales Abzeichen`)
};

const ar_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة اجتماعية`)
};

const fr_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge social`)
};

const ko_consentflow_credentialtype_socialbadge3 = /** @type {(inputs: Consentflow_Credentialtype_Socialbadge3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`소셜 뱃지`)
};

/**
* | output |
* | --- |
* | "Social Badge" |
*
* @param {Consentflow_Credentialtype_Socialbadge3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_socialbadge3 = /** @type {((inputs?: Consentflow_Credentialtype_Socialbadge3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Socialbadge3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_socialbadge3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_socialbadge3(inputs)
	if (locale === "de") return de_consentflow_credentialtype_socialbadge3(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_socialbadge3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_socialbadge3(inputs)
	return ko_consentflow_credentialtype_socialbadge3(inputs)
});
export { consentflow_credentialtype_socialbadge3 as "consentFlow.credentialType.socialBadge" }