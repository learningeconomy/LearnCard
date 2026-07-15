/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Okay1Inputs */

const en_consentflow_okay1 = /** @type {(inputs: Consentflow_Okay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Okay`)
};

const es_consentflow_okay1 = /** @type {(inputs: Consentflow_Okay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De acuerdo`)
};

const fr_consentflow_okay1 = /** @type {(inputs: Consentflow_Okay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`D'accord`)
};

const ar_consentflow_okay1 = /** @type {(inputs: Consentflow_Okay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Okay`)
};

/**
* | output |
* | --- |
* | "Okay" |
*
* @param {Consentflow_Okay1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_okay1 = /** @type {((inputs?: Consentflow_Okay1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Okay1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_okay1(inputs)
	if (locale === "es") return es_consentflow_okay1(inputs)
	if (locale === "fr") return fr_consentflow_okay1(inputs)
	return ar_consentflow_okay1(inputs)
});
export { consentflow_okay1 as "consentFlow.okay" }