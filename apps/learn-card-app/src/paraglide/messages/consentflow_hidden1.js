/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Hidden1Inputs */

const en_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hidden`)
};

const es_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oculto`)
};

const de_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausgeblendet`)
};

const ar_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مخفي`)
};

const fr_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masqué`)
};

const ko_consentflow_hidden1 = /** @type {(inputs: Consentflow_Hidden1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`숨김`)
};

/**
* | output |
* | --- |
* | "Hidden" |
*
* @param {Consentflow_Hidden1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_hidden1 = /** @type {((inputs?: Consentflow_Hidden1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Hidden1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_hidden1(inputs)
	if (locale === "es") return es_consentflow_hidden1(inputs)
	if (locale === "de") return de_consentflow_hidden1(inputs)
	if (locale === "ar") return ar_consentflow_hidden1(inputs)
	if (locale === "fr") return fr_consentflow_hidden1(inputs)
	return ko_consentflow_hidden1(inputs)
});
export { consentflow_hidden1 as "consentFlow.hidden" }