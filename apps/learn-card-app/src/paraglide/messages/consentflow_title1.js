/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Title1Inputs */

const en_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent`)
};

const es_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentimiento`)
};

const de_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zustimmung`)
};

const ar_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموافقة`)
};

const fr_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement`)
};

const ko_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`동의`)
};

/**
* | output |
* | --- |
* | "Consent" |
*
* @param {Consentflow_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_title1 = /** @type {((inputs?: Consentflow_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_title1(inputs)
	if (locale === "es") return es_consentflow_title1(inputs)
	if (locale === "de") return de_consentflow_title1(inputs)
	if (locale === "ar") return ar_consentflow_title1(inputs)
	if (locale === "fr") return fr_consentflow_title1(inputs)
	return ko_consentflow_title1(inputs)
});
export { consentflow_title1 as "consentFlow.title" }