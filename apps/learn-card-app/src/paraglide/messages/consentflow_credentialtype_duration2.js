/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Credentialtype_Duration2Inputs */

const en_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duration`)
};

const es_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Duración`)
};

const de_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dauer`)
};

const ar_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المدة`)
};

const fr_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Durée`)
};

const ko_consentflow_credentialtype_duration2 = /** @type {(inputs: Consentflow_Credentialtype_Duration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기간`)
};

/**
* | output |
* | --- |
* | "Duration" |
*
* @param {Consentflow_Credentialtype_Duration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_credentialtype_duration2 = /** @type {((inputs?: Consentflow_Credentialtype_Duration2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Credentialtype_Duration2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_credentialtype_duration2(inputs)
	if (locale === "es") return es_consentflow_credentialtype_duration2(inputs)
	if (locale === "de") return de_consentflow_credentialtype_duration2(inputs)
	if (locale === "ar") return ar_consentflow_credentialtype_duration2(inputs)
	if (locale === "fr") return fr_consentflow_credentialtype_duration2(inputs)
	return ko_consentflow_credentialtype_duration2(inputs)
});
export { consentflow_credentialtype_duration2 as "consentFlow.credentialType.duration" }