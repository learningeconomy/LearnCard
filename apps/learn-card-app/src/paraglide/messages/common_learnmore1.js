/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Learnmore1Inputs */

const en_common_learnmore1 = /** @type {(inputs: Common_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learn More`)
};

const es_common_learnmore1 = /** @type {(inputs: Common_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más información`)
};

const fr_common_learnmore1 = /** @type {(inputs: Common_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En savoir plus`)
};

const ar_common_learnmore1 = /** @type {(inputs: Common_Learnmore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اعرف المزيد`)
};

/**
* | output |
* | --- |
* | "Learn More" |
*
* @param {Common_Learnmore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_learnmore1 = /** @type {((inputs?: Common_Learnmore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Learnmore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_learnmore1(inputs)
	if (locale === "es") return es_common_learnmore1(inputs)
	if (locale === "fr") return fr_common_learnmore1(inputs)
	return ar_common_learnmore1(inputs)
});
export { common_learnmore1 as "common.learnMore" }