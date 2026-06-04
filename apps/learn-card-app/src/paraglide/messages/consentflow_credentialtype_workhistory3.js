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

const de_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berufserfahrung`)
};

const ar_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل العمل`)
};

const fr_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle`)
};

const ko_consentflow_credentialtype_workhistory3 = /** @type {(inputs: Consentflow_Credentialtype_Workhistory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경력`)
};

/**
* | output |
* | --- |
* | "Work History" |
*
* @param {Consentflow_Credentialtype_Workhistory3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_workhistory3 = /** @type {((inputs?: Consentflow_Credentialtype_Workhistory3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Workhistory3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "de") return de_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_workhistory3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_workhistory3(inputs)
	return ko_consentflow_credentialtype_workhistory3(inputs)
});
export { consentflow_credentialtype_workhistory3 as "consentFlow.credentialType.workHistory" }