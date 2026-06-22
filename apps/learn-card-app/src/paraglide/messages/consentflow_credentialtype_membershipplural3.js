/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Membershipplural3Inputs */

const en_consentflow_credentialtype_membershipplural3 = /** @type {(inputs: Consentflow_Credentialtype_Membershipplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Memberships`)
};

const es_consentflow_credentialtype_membershipplural3 = /** @type {(inputs: Consentflow_Credentialtype_Membershipplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membresías`)
};

const fr_consentflow_credentialtype_membershipplural3 = /** @type {(inputs: Consentflow_Credentialtype_Membershipplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésions`)
};

const ar_consentflow_credentialtype_membershipplural3 = /** @type {(inputs: Consentflow_Credentialtype_Membershipplural3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العضويات`)
};

/**
* | output |
* | --- |
* | "Memberships" |
*
* @param {Consentflow_Credentialtype_Membershipplural3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_membershipplural3 = /** @type {((inputs?: Consentflow_Credentialtype_Membershipplural3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Membershipplural3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_membershipplural3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_membershipplural3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_membershipplural3(inputs)
	return ar_consentflow_credentialtype_membershipplural3(inputs)
});
export { consentflow_credentialtype_membershipplural3 as "consentFlow.credentialType.membershipPlural" }