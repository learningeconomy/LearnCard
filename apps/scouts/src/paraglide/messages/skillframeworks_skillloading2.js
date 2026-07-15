/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Skillloading2Inputs */

const en_skillframeworks_skillloading2 = /** @type {(inputs: Skillframeworks_Skillloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... competencies`)
};

const es_skillframeworks_skillloading2 = /** @type {(inputs: Skillframeworks_Skillloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... competencias`)
};

const fr_skillframeworks_skillloading2 = /** @type {(inputs: Skillframeworks_Skillloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... compétences`)
};

const ar_skillframeworks_skillloading2 = /** @type {(inputs: Skillframeworks_Skillloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`... كفاءات`)
};

/**
* | output |
* | --- |
* | "... competencies" |
*
* @param {Skillframeworks_Skillloading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_skillloading2 = /** @type {((inputs?: Skillframeworks_Skillloading2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Skillloading2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_skillloading2(inputs)
	if (locale === "es") return es_skillframeworks_skillloading2(inputs)
	if (locale === "fr") return fr_skillframeworks_skillloading2(inputs)
	return ar_skillframeworks_skillloading2(inputs)
});
export { skillframeworks_skillloading2 as "skillFrameworks.skillLoading" }