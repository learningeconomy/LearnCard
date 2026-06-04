/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Accept1Inputs */

const en_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept`)
};

const es_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const de_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annehmen`)
};

const ar_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول`)
};

const fr_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter`)
};

const ko_consentflow_accept1 = /** @type {(inputs: Consentflow_Accept1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`수락`)
};

/**
* | output |
* | --- |
* | "Accept" |
*
* @param {Consentflow_Accept1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_accept1 = /** @type {((inputs?: Consentflow_Accept1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Accept1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_accept1(inputs)
	if (locale === "es") return es_consentflow_accept1(inputs)
	if (locale === "de") return de_consentflow_accept1(inputs)
	if (locale === "ar") return ar_consentflow_accept1(inputs)
	if (locale === "fr") return fr_consentflow_accept1(inputs)
	return ko_consentflow_accept1(inputs)
});
export { consentflow_accept1 as "consentFlow.accept" }