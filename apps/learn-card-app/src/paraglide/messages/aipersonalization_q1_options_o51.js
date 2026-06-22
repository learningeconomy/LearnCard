/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Options_O51Inputs */

const en_aipersonalization_q1_options_o51 = /** @type {(inputs: Aipersonalization_Q1_Options_O51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Follow instructions`)
};

const es_aipersonalization_q1_options_o51 = /** @type {(inputs: Aipersonalization_Q1_Options_O51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir instrucciones`)
};

const fr_aipersonalization_q1_options_o51 = /** @type {(inputs: Aipersonalization_Q1_Options_O51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivre des instructions`)
};

const ar_aipersonalization_q1_options_o51 = /** @type {(inputs: Aipersonalization_Q1_Options_O51Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتّباع التعليمات`)
};

/**
* | output |
* | --- |
* | "Follow instructions" |
*
* @param {Aipersonalization_Q1_Options_O51Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_options_o51 = /** @type {((inputs?: Aipersonalization_Q1_Options_O51Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Options_O51Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q1_options_o51(inputs)
	if (locale === "es") return es_aipersonalization_q1_options_o51(inputs)
	if (locale === "fr") return fr_aipersonalization_q1_options_o51(inputs)
	return ar_aipersonalization_q1_options_o51(inputs)
});
export { aipersonalization_q1_options_o51 as "aiPersonalization.q1.options.o5" }