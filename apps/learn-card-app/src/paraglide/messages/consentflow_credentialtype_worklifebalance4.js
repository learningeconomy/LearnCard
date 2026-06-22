/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Worklifebalance4Inputs */

const en_consentflow_credentialtype_worklifebalance4 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Life Balance`)
};

const es_consentflow_credentialtype_worklifebalance4 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Equilibrio trabajo-vida`)
};

const fr_consentflow_credentialtype_worklifebalance4 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Équilibre travail-vie`)
};

const ar_consentflow_credentialtype_worklifebalance4 = /** @type {(inputs: Consentflow_Credentialtype_Worklifebalance4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوازن بين العمل والحياة`)
};

/**
* | output |
* | --- |
* | "Work Life Balance" |
*
* @param {Consentflow_Credentialtype_Worklifebalance4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_worklifebalance4 = /** @type {((inputs?: Consentflow_Credentialtype_Worklifebalance4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Worklifebalance4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_worklifebalance4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_worklifebalance4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_worklifebalance4(inputs)
	return ar_consentflow_credentialtype_worklifebalance4(inputs)
});
export { consentflow_credentialtype_worklifebalance4 as "consentFlow.credentialType.workLifeBalance" }