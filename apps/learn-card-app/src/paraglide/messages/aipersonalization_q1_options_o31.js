/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Options_O31Inputs */

const en_aipersonalization_q1_options_o31 = /** @type {(inputs: Aipersonalization_Q1_Options_O31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discuss and ask questions`)
};

const es_aipersonalization_q1_options_o31 = /** @type {(inputs: Aipersonalization_Q1_Options_O31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conversar y hacer preguntas`)
};

const fr_aipersonalization_q1_options_o31 = /** @type {(inputs: Aipersonalization_Q1_Options_O31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Discuter et poser des questions`)
};

const ar_aipersonalization_q1_options_o31 = /** @type {(inputs: Aipersonalization_Q1_Options_O31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المناقشة وطرح الأسئلة`)
};

/**
* | output |
* | --- |
* | "Discuss and ask questions" |
*
* @param {Aipersonalization_Q1_Options_O31Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_options_o31 = /** @type {((inputs?: Aipersonalization_Q1_Options_O31Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Options_O31Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q1_options_o31(inputs)
	if (locale === "es") return es_aipersonalization_q1_options_o31(inputs)
	if (locale === "fr") return fr_aipersonalization_q1_options_o31(inputs)
	return ar_aipersonalization_q1_options_o31(inputs)
});
export { aipersonalization_q1_options_o31 as "aiPersonalization.q1.options.o3" }