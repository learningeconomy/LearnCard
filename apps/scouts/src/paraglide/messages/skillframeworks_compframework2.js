/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Compframework2Inputs */

const en_skillframeworks_compframework2 = /** @type {(inputs: Skillframeworks_Compframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Competencies Framework`)
};

const es_skillframeworks_compframework2 = /** @type {(inputs: Skillframeworks_Compframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco de Competencias`)
};

const fr_skillframeworks_compframework2 = /** @type {(inputs: Skillframeworks_Compframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre de compétences`)
};

const ar_skillframeworks_compframework2 = /** @type {(inputs: Skillframeworks_Compframework2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إطار الكفاءات`)
};

/**
* | output |
* | --- |
* | "Competencies Framework" |
*
* @param {Skillframeworks_Compframework2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_compframework2 = /** @type {((inputs?: Skillframeworks_Compframework2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Compframework2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_compframework2(inputs)
	if (locale === "es") return es_skillframeworks_compframework2(inputs)
	if (locale === "fr") return fr_skillframeworks_compframework2(inputs)
	return ar_skillframeworks_compframework2(inputs)
});
export { skillframeworks_compframework2 as "skillFrameworks.compFramework" }