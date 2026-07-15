/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Hasremoved2Inputs */

const en_skillframeworks_hasremoved2 = /** @type {(inputs: Skillframeworks_Hasremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`has been removed`)
};

const es_skillframeworks_hasremoved2 = /** @type {(inputs: Skillframeworks_Hasremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se ha eliminado`)
};

const fr_skillframeworks_hasremoved2 = /** @type {(inputs: Skillframeworks_Hasremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a été supprimé`)
};

const ar_skillframeworks_hasremoved2 = /** @type {(inputs: Skillframeworks_Hasremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت الإزالة`)
};

/**
* | output |
* | --- |
* | "has been removed" |
*
* @param {Skillframeworks_Hasremoved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_hasremoved2 = /** @type {((inputs?: Skillframeworks_Hasremoved2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Hasremoved2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_hasremoved2(inputs)
	if (locale === "es") return es_skillframeworks_hasremoved2(inputs)
	if (locale === "fr") return fr_skillframeworks_hasremoved2(inputs)
	return ar_skillframeworks_hasremoved2(inputs)
});
export { skillframeworks_hasremoved2 as "skillFrameworks.hasRemoved" }