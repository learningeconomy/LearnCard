/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Haveadded2Inputs */

const en_skillframeworks_haveadded2 = /** @type {(inputs: Skillframeworks_Haveadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`have been added`)
};

const es_skillframeworks_haveadded2 = /** @type {(inputs: Skillframeworks_Haveadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se han añadido`)
};

const fr_skillframeworks_haveadded2 = /** @type {(inputs: Skillframeworks_Haveadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ont été ajoutés`)
};

const ar_skillframeworks_haveadded2 = /** @type {(inputs: Skillframeworks_Haveadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الإضافة`)
};

/**
* | output |
* | --- |
* | "have been added" |
*
* @param {Skillframeworks_Haveadded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_haveadded2 = /** @type {((inputs?: Skillframeworks_Haveadded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Haveadded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_haveadded2(inputs)
	if (locale === "es") return es_skillframeworks_haveadded2(inputs)
	if (locale === "fr") return fr_skillframeworks_haveadded2(inputs)
	return ar_skillframeworks_haveadded2(inputs)
});
export { skillframeworks_haveadded2 as "skillFrameworks.haveAdded" }