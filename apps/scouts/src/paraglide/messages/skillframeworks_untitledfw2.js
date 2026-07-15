/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Untitledfw2Inputs */

const en_skillframeworks_untitledfw2 = /** @type {(inputs: Skillframeworks_Untitledfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untitled Framework`)
};

const es_skillframeworks_untitledfw2 = /** @type {(inputs: Skillframeworks_Untitledfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco sin Título`)
};

const fr_skillframeworks_untitledfw2 = /** @type {(inputs: Skillframeworks_Untitledfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre sans titre`)
};

const ar_skillframeworks_untitledfw2 = /** @type {(inputs: Skillframeworks_Untitledfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untitled Framework`)
};

/**
* | output |
* | --- |
* | "Untitled Framework" |
*
* @param {Skillframeworks_Untitledfw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_untitledfw2 = /** @type {((inputs?: Skillframeworks_Untitledfw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Untitledfw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_untitledfw2(inputs)
	if (locale === "es") return es_skillframeworks_untitledfw2(inputs)
	if (locale === "fr") return fr_skillframeworks_untitledfw2(inputs)
	return ar_skillframeworks_untitledfw2(inputs)
});
export { skillframeworks_untitledfw2 as "skillFrameworks.untitledFw" }