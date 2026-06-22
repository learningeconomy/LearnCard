/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allow1Inputs */

const en_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allow`)
};

const es_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permitir`)
};

const fr_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoriser`)
};

const ar_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح`)
};

/**
* | output |
* | --- |
* | "Allow" |
*
* @param {Consentflow_Allow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allow1 = /** @type {((inputs?: Consentflow_Allow1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allow1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allow1(inputs)
	if (locale === "es") return es_consentflow_allow1(inputs)
	if (locale === "fr") return fr_consentflow_allow1(inputs)
	return ar_consentflow_allow1(inputs)
});
export { consentflow_allow1 as "consentFlow.allow" }