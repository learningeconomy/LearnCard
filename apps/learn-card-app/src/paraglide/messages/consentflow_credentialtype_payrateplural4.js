/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Payrateplural4Inputs */

const en_consentflow_credentialtype_payrateplural4 = /** @type {(inputs: Consentflow_Credentialtype_Payrateplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pay Rates`)
};

const es_consentflow_credentialtype_payrateplural4 = /** @type {(inputs: Consentflow_Credentialtype_Payrateplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tasas salariales`)
};

const fr_consentflow_credentialtype_payrateplural4 = /** @type {(inputs: Consentflow_Credentialtype_Payrateplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Taux de rémunération`)
};

const ar_consentflow_credentialtype_payrateplural4 = /** @type {(inputs: Consentflow_Credentialtype_Payrateplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معدلات الأجر`)
};

/**
* | output |
* | --- |
* | "Pay Rates" |
*
* @param {Consentflow_Credentialtype_Payrateplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_payrateplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Payrateplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Payrateplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_payrateplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_payrateplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_payrateplural4(inputs)
	return ar_consentflow_credentialtype_payrateplural4(inputs)
});
export { consentflow_credentialtype_payrateplural4 as "consentFlow.credentialType.payRatePlural" }