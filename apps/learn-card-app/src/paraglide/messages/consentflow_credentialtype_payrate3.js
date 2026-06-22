/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Payrate3Inputs */

const en_consentflow_credentialtype_payrate3 = /** @type {(inputs: Consentflow_Credentialtype_Payrate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pay Rate`)
};

const es_consentflow_credentialtype_payrate3 = /** @type {(inputs: Consentflow_Credentialtype_Payrate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tasa salarial`)
};

const fr_consentflow_credentialtype_payrate3 = /** @type {(inputs: Consentflow_Credentialtype_Payrate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Taux de rémunération`)
};

const ar_consentflow_credentialtype_payrate3 = /** @type {(inputs: Consentflow_Credentialtype_Payrate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معدل الأجر`)
};

/**
* | output |
* | --- |
* | "Pay Rate" |
*
* @param {Consentflow_Credentialtype_Payrate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_payrate3 = /** @type {((inputs?: Consentflow_Credentialtype_Payrate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Payrate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_payrate3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_payrate3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_payrate3(inputs)
	return ar_consentflow_credentialtype_payrate3(inputs)
});
export { consentflow_credentialtype_payrate3 as "consentFlow.credentialType.payRate" }