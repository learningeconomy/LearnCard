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

const fr_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisation en cours...`)
};

const ar_consentflow_allowing1 = /** @type {(inputs: Consentflow_Allowing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري السماح...`)
};

/**
* | output |
* | --- |
* | "Allowing..." |
*
* @param {Consentflow_Allowing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allowing1 = /** @type {((inputs?: Consentflow_Allowing1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowing1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowing1(inputs)
	if (locale === "es") return es_consentflow_allowing1(inputs)
	if (locale === "fr") return fr_consentflow_allowing1(inputs)
	return ar_consentflow_allowing1(inputs)
});
export { consentflow_allowing1 as "consentFlow.allowing" }