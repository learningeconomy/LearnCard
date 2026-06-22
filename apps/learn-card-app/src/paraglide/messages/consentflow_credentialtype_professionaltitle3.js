/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Professionaltitle3Inputs */

const en_consentflow_credentialtype_professionaltitle3 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional Title`)
};

const es_consentflow_credentialtype_professionaltitle3 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título profesional`)
};

const fr_consentflow_credentialtype_professionaltitle3 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre professionnel`)
};

const ar_consentflow_credentialtype_professionaltitle3 = /** @type {(inputs: Consentflow_Credentialtype_Professionaltitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المسمى المهني`)
};

/**
* | output |
* | --- |
* | "Professional Title" |
*
* @param {Consentflow_Credentialtype_Professionaltitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_professionaltitle3 = /** @type {((inputs?: Consentflow_Credentialtype_Professionaltitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Professionaltitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_professionaltitle3(inputs)
	if (locale === "es") return es_consentflow_credentialtype_professionaltitle3(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_professionaltitle3(inputs)
	return ar_consentflow_credentialtype_professionaltitle3(inputs)
});
export { consentflow_credentialtype_professionaltitle3 as "consentFlow.credentialType.professionalTitle" }