/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Separator1Inputs */

const en_consentflow_separator1 = /** @type {(inputs: Consentflow_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const es_consentflow_separator1 = /** @type {(inputs: Consentflow_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const fr_consentflow_separator1 = /** @type {(inputs: Consentflow_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

const ar_consentflow_separator1 = /** @type {(inputs: Consentflow_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` • `)
};

/**
* | output |
* | --- |
* | "•" |
*
* @param {Consentflow_Separator1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_separator1 = /** @type {((inputs?: Consentflow_Separator1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Separator1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_separator1(inputs)
	if (locale === "es") return es_consentflow_separator1(inputs)
	if (locale === "fr") return fr_consentflow_separator1(inputs)
	return ar_consentflow_separator1(inputs)
});
export { consentflow_separator1 as "consentFlow.separator" }