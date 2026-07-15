/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Haveremoved2Inputs */

const en_skillframeworks_haveremoved2 = /** @type {(inputs: Skillframeworks_Haveremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`have been removed`)
};

const es_skillframeworks_haveremoved2 = /** @type {(inputs: Skillframeworks_Haveremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se han eliminado`)
};

const fr_skillframeworks_haveremoved2 = /** @type {(inputs: Skillframeworks_Haveremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ont été supprimés`)
};

const ar_skillframeworks_haveremoved2 = /** @type {(inputs: Skillframeworks_Haveremoved2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`have been removed`)
};

/**
* | output |
* | --- |
* | "have been removed" |
*
* @param {Skillframeworks_Haveremoved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_haveremoved2 = /** @type {((inputs?: Skillframeworks_Haveremoved2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Haveremoved2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_haveremoved2(inputs)
	if (locale === "es") return es_skillframeworks_haveremoved2(inputs)
	if (locale === "fr") return fr_skillframeworks_haveremoved2(inputs)
	return ar_skillframeworks_haveremoved2(inputs)
});
export { skillframeworks_haveremoved2 as "skillFrameworks.haveRemoved" }