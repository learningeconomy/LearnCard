/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Done1Inputs */

const en_skillframeworks_done1 = /** @type {(inputs: Skillframeworks_Done1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

const es_skillframeworks_done1 = /** @type {(inputs: Skillframeworks_Done1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hecho`)
};

const fr_skillframeworks_done1 = /** @type {(inputs: Skillframeworks_Done1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminé`)
};

const ar_skillframeworks_done1 = /** @type {(inputs: Skillframeworks_Done1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

/**
* | output |
* | --- |
* | "Done" |
*
* @param {Skillframeworks_Done1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_done1 = /** @type {((inputs?: Skillframeworks_Done1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Done1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_done1(inputs)
	if (locale === "es") return es_skillframeworks_done1(inputs)
	if (locale === "fr") return fr_skillframeworks_done1(inputs)
	return ar_skillframeworks_done1(inputs)
});
export { skillframeworks_done1 as "skillFrameworks.done" }