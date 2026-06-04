/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allowing1Inputs */

const en_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allowing...`)
};

const es_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permitiendo...`)
};

const de_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erlaube...`)
};

const ar_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري السماح`)
};

const fr_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisation...`)
};

const ko_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`허용 중...`)
};

/**
* | output |
* | --- |
* | "Allowing..." |
*
* @param {Consentflow_Allowing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_allowing1 = /** @type {((inputs?: Consentflow_Allowing1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowing1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowing1(inputs)
	if (locale === "es") return es_consentflow_allowing1(inputs)
	if (locale === "de") return de_consentflow_allowing1(inputs)
	if (locale === "ar") return ar_consentflow_allowing1(inputs)
	if (locale === "fr") return fr_consentflow_allowing1(inputs)
	return ko_consentflow_allowing1(inputs)
});
export { consentflow_allowing1 as "consentFlow.allowing" }