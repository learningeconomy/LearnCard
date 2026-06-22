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

const fr_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consentement`)
};

const ar_consentflow_title1 = /** @type {(inputs: Consentflow_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent" |
*
* @param {Consentflow_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_title1 = /** @type {((inputs?: Consentflow_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_title1(inputs)
	if (locale === "es") return es_consentflow_title1(inputs)
	if (locale === "fr") return fr_consentflow_title1(inputs)
	return ar_consentflow_title1(inputs)
});
export { consentflow_title1 as "consentFlow.title" }