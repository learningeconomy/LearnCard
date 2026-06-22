/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Options_O41Inputs */

const en_aipersonalization_q1_options_o41 = /** @type {(inputs: Aipersonalization_Q1_Options_O41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Practice hands on`)
};

const es_aipersonalization_q1_options_o41 = /** @type {(inputs: Aipersonalization_Q1_Options_O41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Practicar directamente`)
};

const fr_aipersonalization_q1_options_o41 = /** @type {(inputs: Aipersonalization_Q1_Options_O41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pratiquer de manière concrète`)
};

const ar_aipersonalization_q1_options_o41 = /** @type {(inputs: Aipersonalization_Q1_Options_O41Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيق العملي`)
};

/**
* | output |
* | --- |
* | "Practice hands on" |
*
* @param {Aipersonalization_Q1_Options_O41Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_options_o41 = /** @type {((inputs?: Aipersonalization_Q1_Options_O41Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Options_O41Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q1_options_o41(inputs)
	if (locale === "es") return es_aipersonalization_q1_options_o41(inputs)
	if (locale === "fr") return fr_aipersonalization_q1_options_o41(inputs)
	return ar_aipersonalization_q1_options_o41(inputs)
});
export { aipersonalization_q1_options_o41 as "aiPersonalization.q1.options.o4" }