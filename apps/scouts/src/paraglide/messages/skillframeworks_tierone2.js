/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Tierone2Inputs */

const en_skillframeworks_tierone2 = /** @type {(inputs: Skillframeworks_Tierone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 tier`)
};

const es_skillframeworks_tierone2 = /** @type {(inputs: Skillframeworks_Tierone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 nivel`)
};

const fr_skillframeworks_tierone2 = /** @type {(inputs: Skillframeworks_Tierone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 niveau`)
};

const ar_skillframeworks_tierone2 = /** @type {(inputs: Skillframeworks_Tierone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`1 tier`)
};

/**
* | output |
* | --- |
* | "1 tier" |
*
* @param {Skillframeworks_Tierone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_tierone2 = /** @type {((inputs?: Skillframeworks_Tierone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Tierone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_tierone2(inputs)
	if (locale === "es") return es_skillframeworks_tierone2(inputs)
	if (locale === "fr") return fr_skillframeworks_tierone2(inputs)
	return ar_skillframeworks_tierone2(inputs)
});
export { skillframeworks_tierone2 as "skillFrameworks.tierOne" }