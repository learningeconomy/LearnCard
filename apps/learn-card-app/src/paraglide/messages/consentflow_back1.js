/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Back1Inputs */

const en_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver`)
};

const de_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

const fr_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ko_consentflow_back1 = /** @type {(inputs: Consentflow_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`뒤로`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Consentflow_Back1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_back1 = /** @type {((inputs?: Consentflow_Back1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Back1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_back1(inputs)
	if (locale === "es") return es_consentflow_back1(inputs)
	if (locale === "de") return de_consentflow_back1(inputs)
	if (locale === "ar") return ar_consentflow_back1(inputs)
	if (locale === "fr") return fr_consentflow_back1(inputs)
	return ko_consentflow_back1(inputs)
});
export { consentflow_back1 as "consentFlow.back" }