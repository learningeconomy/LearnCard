/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Options_O21Inputs */

const en_aipersonalization_q1_options_o21 = /** @type {(inputs: Aipersonalization_Q1_Options_O21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read and analyze concepts`)
};

const es_aipersonalization_q1_options_o21 = /** @type {(inputs: Aipersonalization_Q1_Options_O21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leer y analizar conceptos`)
};

const fr_aipersonalization_q1_options_o21 = /** @type {(inputs: Aipersonalization_Q1_Options_O21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lire et analyser des concepts`)
};

const ar_aipersonalization_q1_options_o21 = /** @type {(inputs: Aipersonalization_Q1_Options_O21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قراءة المفاهيم وتحليلها`)
};

/**
* | output |
* | --- |
* | "Read and analyze concepts" |
*
* @param {Aipersonalization_Q1_Options_O21Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_options_o21 = /** @type {((inputs?: Aipersonalization_Q1_Options_O21Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Options_O21Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q1_options_o21(inputs)
	if (locale === "es") return es_aipersonalization_q1_options_o21(inputs)
	if (locale === "fr") return fr_aipersonalization_q1_options_o21(inputs)
	return ar_aipersonalization_q1_options_o21(inputs)
});
export { aipersonalization_q1_options_o21 as "aiPersonalization.q1.options.o2" }