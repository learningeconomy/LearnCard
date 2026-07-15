/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Yes1Inputs */

const en_consentflow_yes1 = /** @type {(inputs: Consentflow_Yes1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes`)
};

const es_consentflow_yes1 = /** @type {(inputs: Consentflow_Yes1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí`)
};

const fr_consentflow_yes1 = /** @type {(inputs: Consentflow_Yes1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui`)
};

const ar_consentflow_yes1 = /** @type {(inputs: Consentflow_Yes1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم`)
};

/**
* | output |
* | --- |
* | "Yes" |
*
* @param {Consentflow_Yes1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_yes1 = /** @type {((inputs?: Consentflow_Yes1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Yes1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_yes1(inputs)
	if (locale === "es") return es_consentflow_yes1(inputs)
	if (locale === "fr") return fr_consentflow_yes1(inputs)
	return ar_consentflow_yes1(inputs)
});
export { consentflow_yes1 as "consentFlow.yes" }