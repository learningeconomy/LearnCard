/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Off1Inputs */

const en_consentflow_off1 = /** @type {(inputs: Consentflow_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Off`)
};

const es_consentflow_off1 = /** @type {(inputs: Consentflow_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apagado`)
};

const fr_consentflow_off1 = /** @type {(inputs: Consentflow_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désactivé`)
};

const ar_consentflow_off1 = /** @type {(inputs: Consentflow_Off1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إيقاف`)
};

/**
* | output |
* | --- |
* | "Off" |
*
* @param {Consentflow_Off1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_off1 = /** @type {((inputs?: Consentflow_Off1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Off1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_off1(inputs)
	if (locale === "es") return es_consentflow_off1(inputs)
	if (locale === "fr") return fr_consentflow_off1(inputs)
	return ar_consentflow_off1(inputs)
});
export { consentflow_off1 as "consentFlow.off" }