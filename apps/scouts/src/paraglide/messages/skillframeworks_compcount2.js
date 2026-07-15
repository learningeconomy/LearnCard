/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Compcount2Inputs */

const en_skillframeworks_compcount2 = /** @type {(inputs: Skillframeworks_Compcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Competencies`)
};

const es_skillframeworks_compcount2 = /** @type {(inputs: Skillframeworks_Compcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Competencias`)
};

const fr_skillframeworks_compcount2 = /** @type {(inputs: Skillframeworks_Compcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétences`)
};

const ar_skillframeworks_compcount2 = /** @type {(inputs: Skillframeworks_Compcount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Competencies`)
};

/**
* | output |
* | --- |
* | "Competencies" |
*
* @param {Skillframeworks_Compcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_compcount2 = /** @type {((inputs?: Skillframeworks_Compcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Compcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_compcount2(inputs)
	if (locale === "es") return es_skillframeworks_compcount2(inputs)
	if (locale === "fr") return fr_skillframeworks_compcount2(inputs)
	return ar_skillframeworks_compcount2(inputs)
});
export { skillframeworks_compcount2 as "skillFrameworks.compCount" }