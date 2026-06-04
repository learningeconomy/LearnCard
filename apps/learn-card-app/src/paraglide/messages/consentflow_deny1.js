/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Deny1Inputs */

const en_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deny`)
};

const es_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denegar`)
};

const de_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ablehnen`)
};

const ar_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

const fr_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refuser`)
};

const ko_consentflow_deny1 = /** @type {(inputs: Consentflow_Deny1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`거부`)
};

/**
* | output |
* | --- |
* | "Deny" |
*
* @param {Consentflow_Deny1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_deny1 = /** @type {((inputs?: Consentflow_Deny1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Deny1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_deny1(inputs)
	if (locale === "es") return es_consentflow_deny1(inputs)
	if (locale === "de") return de_consentflow_deny1(inputs)
	if (locale === "ar") return ar_consentflow_deny1(inputs)
	if (locale === "fr") return fr_consentflow_deny1(inputs)
	return ko_consentflow_deny1(inputs)
});
export { consentflow_deny1 as "consentFlow.deny" }