/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Sheet1Inputs */

const en_skillframeworks_sheet1 = /** @type {(inputs: Skillframeworks_Sheet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sheet`)
};

const es_skillframeworks_sheet1 = /** @type {(inputs: Skillframeworks_Sheet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hoja`)
};

const fr_skillframeworks_sheet1 = /** @type {(inputs: Skillframeworks_Sheet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feuille`)
};

const ar_skillframeworks_sheet1 = /** @type {(inputs: Skillframeworks_Sheet1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sheet`)
};

/**
* | output |
* | --- |
* | "Sheet" |
*
* @param {Skillframeworks_Sheet1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_sheet1 = /** @type {((inputs?: Skillframeworks_Sheet1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Sheet1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_sheet1(inputs)
	if (locale === "es") return es_skillframeworks_sheet1(inputs)
	if (locale === "fr") return fr_skillframeworks_sheet1(inputs)
	return ar_skillframeworks_sheet1(inputs)
});
export { skillframeworks_sheet1 as "skillFrameworks.sheet" }