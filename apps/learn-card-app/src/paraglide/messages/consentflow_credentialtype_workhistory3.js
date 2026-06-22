/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Workhistory3Inputs */

const en_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const es_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial laboral`)
};

const fr_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle`)
};

const ar_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل العمل`)
};

/**
* | output |
* | --- |
* | "Work History" |
*
* @param {Consentflow_Credentialtype_Workhistory3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_workhistory3 = /** @type {((inputs?: Consentflow_Credentialtype_Workhistory3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Workhistory3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_workhistory3(inputs)
	return ar_consentflow_credentialtype_workhistory3(inputs)
});
export { consentflow_credentialtype_workhistory3 as "consentFlow.credentialType.workHistory" }