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

const fr_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adhésion`)
};

const ar_consentflow_credentialtype_membership2 = /** @type {(inputs: Consentflow_Credentialtype_Membership2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عضوية`)
};

/**
* | output |
* | --- |
* | "Membership" |
*
* @param {Consentflow_Credentialtype_Membership2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_membership2 = /** @type {((inputs?: Consentflow_Credentialtype_Membership2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Membership2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_membership2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_membership2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_membership2(inputs)
	return ar_consentflow_credentialtype_membership2(inputs)
});
export { consentflow_credentialtype_membership2 as "consentFlow.credentialType.membership" }