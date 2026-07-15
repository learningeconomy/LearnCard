/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Codelabel2Inputs */

const en_skillframeworks_codelabel2 = /** @type {(inputs: Skillframeworks_Codelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code`)
};

const es_skillframeworks_codelabel2 = /** @type {(inputs: Skillframeworks_Codelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código`)
};

const fr_skillframeworks_codelabel2 = /** @type {(inputs: Skillframeworks_Codelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code`)
};

const ar_skillframeworks_codelabel2 = /** @type {(inputs: Skillframeworks_Codelabel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code`)
};

/**
* | output |
* | --- |
* | "Code" |
*
* @param {Skillframeworks_Codelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_codelabel2 = /** @type {((inputs?: Skillframeworks_Codelabel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Codelabel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_codelabel2(inputs)
	if (locale === "es") return es_skillframeworks_codelabel2(inputs)
	if (locale === "fr") return fr_skillframeworks_codelabel2(inputs)
	return ar_skillframeworks_codelabel2(inputs)
});
export { skillframeworks_codelabel2 as "skillFrameworks.codeLabel" }