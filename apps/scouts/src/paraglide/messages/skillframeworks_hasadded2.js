/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Hasadded2Inputs */

const en_skillframeworks_hasadded2 = /** @type {(inputs: Skillframeworks_Hasadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`has been added`)
};

const es_skillframeworks_hasadded2 = /** @type {(inputs: Skillframeworks_Hasadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se ha añadido`)
};

const fr_skillframeworks_hasadded2 = /** @type {(inputs: Skillframeworks_Hasadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a été ajouté`)
};

const ar_skillframeworks_hasadded2 = /** @type {(inputs: Skillframeworks_Hasadded2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الإضافة`)
};

/**
* | output |
* | --- |
* | "has been added" |
*
* @param {Skillframeworks_Hasadded2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_hasadded2 = /** @type {((inputs?: Skillframeworks_Hasadded2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Hasadded2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_hasadded2(inputs)
	if (locale === "es") return es_skillframeworks_hasadded2(inputs)
	if (locale === "fr") return fr_skillframeworks_hasadded2(inputs)
	return ar_skillframeworks_hasadded2(inputs)
});
export { skillframeworks_hasadded2 as "skillFrameworks.hasAdded" }