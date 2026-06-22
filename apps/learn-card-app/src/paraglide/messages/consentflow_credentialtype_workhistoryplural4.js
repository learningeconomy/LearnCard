/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Workhistoryplural4Inputs */

const en_consentflow_credentialtype_workhistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workhistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const es_consentflow_credentialtype_workhistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workhistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial laboral`)
};

const fr_consentflow_credentialtype_workhistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workhistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle`)
};

const ar_consentflow_credentialtype_workhistoryplural4 = /** @type {(inputs: Consentflow_Credentialtype_Workhistoryplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل العمل`)
};

/**
* | output |
* | --- |
* | "Work History" |
*
* @param {Consentflow_Credentialtype_Workhistoryplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_workhistoryplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Workhistoryplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Workhistoryplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_workhistoryplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_workhistoryplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_workhistoryplural4(inputs)
	return ar_consentflow_credentialtype_workhistoryplural4(inputs)
});
export { consentflow_credentialtype_workhistoryplural4 as "consentFlow.credentialType.workHistoryPlural" }