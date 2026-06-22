/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipersonalization_Q1_Options_O11Inputs */

const en_aipersonalization_q1_options_o11 = /** @type {(inputs: Aipersonalization_Q1_Options_O11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`See examples or visuals`)
};

const es_aipersonalization_q1_options_o11 = /** @type {(inputs: Aipersonalization_Q1_Options_O11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver ejemplos o recursos visuales`)
};

const fr_aipersonalization_q1_options_o11 = /** @type {(inputs: Aipersonalization_Q1_Options_O11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir des exemples ou des supports visuels`)
};

const ar_aipersonalization_q1_options_o11 = /** @type {(inputs: Aipersonalization_Q1_Options_O11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رؤية أمثلة أو رسوم توضيحية`)
};

/**
* | output |
* | --- |
* | "See examples or visuals" |
*
* @param {Aipersonalization_Q1_Options_O11Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipersonalization_q1_options_o11 = /** @type {((inputs?: Aipersonalization_Q1_Options_O11Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipersonalization_Q1_Options_O11Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipersonalization_q1_options_o11(inputs)
	if (locale === "es") return es_aipersonalization_q1_options_o11(inputs)
	if (locale === "fr") return fr_aipersonalization_q1_options_o11(inputs)
	return ar_aipersonalization_q1_options_o11(inputs)
});
export { aipersonalization_q1_options_o11 as "aiPersonalization.q1.options.o1" }