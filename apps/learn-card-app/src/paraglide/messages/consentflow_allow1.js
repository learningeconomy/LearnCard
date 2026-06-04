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

const de_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erlauben`)
};

const ar_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح`)
};

const fr_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoriser`)
};

const ko_consentflow_allow1 = /** @type {(inputs: Consentflow_Allow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`허용`)
};

/**
* | output |
* | --- |
* | "Allow" |
*
* @param {Consentflow_Allow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_allow1 = /** @type {((inputs?: Consentflow_Allow1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allow1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allow1(inputs)
	if (locale === "es") return es_consentflow_allow1(inputs)
	if (locale === "de") return de_consentflow_allow1(inputs)
	if (locale === "ar") return ar_consentflow_allow1(inputs)
	if (locale === "fr") return fr_consentflow_allow1(inputs)
	return ko_consentflow_allow1(inputs)
});
export { consentflow_allow1 as "consentFlow.allow" }