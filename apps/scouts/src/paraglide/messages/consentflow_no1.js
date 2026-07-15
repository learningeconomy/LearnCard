/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_No1Inputs */

const en_consentflow_no1 = /** @type {(inputs: Consentflow_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const es_consentflow_no1 = /** @type {(inputs: Consentflow_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

const fr_consentflow_no1 = /** @type {(inputs: Consentflow_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non`)
};

const ar_consentflow_no1 = /** @type {(inputs: Consentflow_No1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No`)
};

/**
* | output |
* | --- |
* | "No" |
*
* @param {Consentflow_No1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_no1 = /** @type {((inputs?: Consentflow_No1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_No1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_no1(inputs)
	if (locale === "es") return es_consentflow_no1(inputs)
	if (locale === "fr") return fr_consentflow_no1(inputs)
	return ar_consentflow_no1(inputs)
});
export { consentflow_no1 as "consentFlow.no" }