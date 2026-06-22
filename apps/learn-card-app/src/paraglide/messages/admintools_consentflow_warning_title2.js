/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admintools_Consentflow_Warning_Title2Inputs */

const en_admintools_consentflow_warning_title2 = /** @type {(inputs: Admintools_Consentflow_Warning_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Profile Required`)
};

const es_admintools_consentflow_warning_title2 = /** @type {(inputs: Admintools_Consentflow_Warning_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere un perfil de Organización`)
};

const fr_admintools_consentflow_warning_title2 = /** @type {(inputs: Admintools_Consentflow_Warning_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil d'Organisation requis`)
};

const ar_admintools_consentflow_warning_title2 = /** @type {(inputs: Admintools_Consentflow_Warning_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب ملف تعريف مؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization Profile Required" |
*
* @param {Admintools_Consentflow_Warning_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const admintools_consentflow_warning_title2 = /** @type {((inputs?: Admintools_Consentflow_Warning_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admintools_Consentflow_Warning_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_admintools_consentflow_warning_title2(inputs)
	if (locale === "es") return es_admintools_consentflow_warning_title2(inputs)
	if (locale === "fr") return fr_admintools_consentflow_warning_title2(inputs)
	return ar_admintools_consentflow_warning_title2(inputs)
});
export { admintools_consentflow_warning_title2 as "adminTools.consentFlow.warning.title" }