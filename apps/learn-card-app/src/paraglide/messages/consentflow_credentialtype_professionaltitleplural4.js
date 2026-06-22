/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Professionaltitleplural4Inputs */

const en_consentflow_credentialtype_professionaltitleplural4 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitleplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional Titles`)
};

const es_consentflow_credentialtype_professionaltitleplural4 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitleplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Títulos profesionales`)
};

const fr_consentflow_credentialtype_professionaltitleplural4 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitleplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titres professionnels`)
};

const ar_consentflow_credentialtype_professionaltitleplural4 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitleplural4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسميات المهنية`)
};

/**
* | output |
* | --- |
* | "Professional Titles" |
*
* @param {Consentflow_Credentialtype_Professionaltitleplural4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_professionaltitleplural4 = /** @type {((inputs?: Consentflow_Credentialtype_Professionaltitleplural4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Professionaltitleplural4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_professionaltitleplural4(inputs)
	if (locale === "es") return es_consentflow_credentialtype_professionaltitleplural4(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_professionaltitleplural4(inputs)
	return ar_consentflow_credentialtype_professionaltitleplural4(inputs)
});
export { consentflow_credentialtype_professionaltitleplural4 as "consentFlow.credentialType.professionalTitlePlural" }