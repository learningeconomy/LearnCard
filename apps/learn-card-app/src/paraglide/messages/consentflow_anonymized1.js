/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Anonymized1Inputs */

const en_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymized`)
};

const es_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonimizado`)
};

const de_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymisiert`)
};

const ar_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مجهول`)
};

const fr_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymisé`)
};

const ko_consentflow_anonymized1 = /** @type {(inputs: Consentflow_Anonymized1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`익명화됨`)
};

/**
* | output |
* | --- |
* | "Anonymized" |
*
* @param {Consentflow_Anonymized1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_anonymized1 = /** @type {((inputs?: Consentflow_Anonymized1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Anonymized1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_anonymized1(inputs)
	if (locale === "es") return es_consentflow_anonymized1(inputs)
	if (locale === "de") return de_consentflow_anonymized1(inputs)
	if (locale === "ar") return ar_consentflow_anonymized1(inputs)
	if (locale === "fr") return fr_consentflow_anonymized1(inputs)
	return ko_consentflow_anonymized1(inputs)
});
export { consentflow_anonymized1 as "consentFlow.anonymized" }