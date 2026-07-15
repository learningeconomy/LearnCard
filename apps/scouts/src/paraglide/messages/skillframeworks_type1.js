/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Type1Inputs */

const en_skillframeworks_type1 = /** @type {(inputs: Skillframeworks_Type1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type`)
};

const es_skillframeworks_type1 = /** @type {(inputs: Skillframeworks_Type1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo`)
};

const fr_skillframeworks_type1 = /** @type {(inputs: Skillframeworks_Type1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type`)
};

const ar_skillframeworks_type1 = /** @type {(inputs: Skillframeworks_Type1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`النوع`)
};

/**
* | output |
* | --- |
* | "Type" |
*
* @param {Skillframeworks_Type1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_type1 = /** @type {((inputs?: Skillframeworks_Type1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Type1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_type1(inputs)
	if (locale === "es") return es_skillframeworks_type1(inputs)
	if (locale === "fr") return fr_skillframeworks_type1(inputs)
	return ar_skillframeworks_type1(inputs)
});
export { skillframeworks_type1 as "skillFrameworks.type" }