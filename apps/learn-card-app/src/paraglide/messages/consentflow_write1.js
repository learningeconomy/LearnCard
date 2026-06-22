/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Write1Inputs */

const en_consentflow_write1 = /** @type {(inputs: Consentflow_Write1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write`)
};

const es_consentflow_write1 = /** @type {(inputs: Consentflow_Write1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escribir`)
};

const fr_consentflow_write1 = /** @type {(inputs: Consentflow_Write1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écrire`)
};

const ar_consentflow_write1 = /** @type {(inputs: Consentflow_Write1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كتابة`)
};

/**
* | output |
* | --- |
* | "Write" |
*
* @param {Consentflow_Write1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_write1 = /** @type {((inputs?: Consentflow_Write1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Write1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_write1(inputs)
	if (locale === "es") return es_consentflow_write1(inputs)
	if (locale === "fr") return fr_consentflow_write1(inputs)
	return ar_consentflow_write1(inputs)
});
export { consentflow_write1 as "consentFlow.write" }