/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Membership2Inputs */

const en_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const es_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membresía`)
};

const de_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mitgliedschaft`)
};

const ar_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عضوية`)
};

const fr_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésion`)
};

const ko_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`멤버십`)
};

/**
* | output |
* | --- |
* | "Membership" |
*
* @param {Consentflow_Credentialtype_Membership2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_membership2 = /** @type {((inputs?: Consentflow_Credentialtype_Membership2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Membership2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_membership2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_membership2(inputs)
	if (locale === "de") return de_consentflow_credentialtype_membership2(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_membership2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_membership2(inputs)
	return ko_consentflow_credentialtype_membership2(inputs)
});
export { consentflow_credentialtype_membership2 as "consentFlow.credentialType.membership" }