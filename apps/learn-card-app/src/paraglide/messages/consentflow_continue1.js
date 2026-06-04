/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Continue1Inputs */

const en_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue`)
};

const es_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar`)
};

const de_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fortfahren`)
};

const ar_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة`)
};

const fr_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer`)
};

const ko_consentflow_continue1 = /** @type {(inputs: Consentflow_Continue1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계속`)
};

/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Consentflow_Continue1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_continue1 = /** @type {((inputs?: Consentflow_Continue1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Continue1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_continue1(inputs)
	if (locale === "es") return es_consentflow_continue1(inputs)
	if (locale === "de") return de_consentflow_continue1(inputs)
	if (locale === "ar") return ar_consentflow_continue1(inputs)
	if (locale === "fr") return fr_consentflow_continue1(inputs)
	return ko_consentflow_continue1(inputs)
});
export { consentflow_continue1 as "consentFlow.continue" }