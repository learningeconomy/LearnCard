/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Browsefw2Inputs */

const en_skillframeworks_browsefw2 = /** @type {(inputs: Skillframeworks_Browsefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Framework`)
};

const es_skillframeworks_browsefw2 = /** @type {(inputs: Skillframeworks_Browsefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar Marco`)
};

const fr_skillframeworks_browsefw2 = /** @type {(inputs: Skillframeworks_Browsefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir le cadre`)
};

const ar_skillframeworks_browsefw2 = /** @type {(inputs: Skillframeworks_Browsefw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Framework`)
};

/**
* | output |
* | --- |
* | "Browse Framework" |
*
* @param {Skillframeworks_Browsefw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_browsefw2 = /** @type {((inputs?: Skillframeworks_Browsefw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Browsefw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_browsefw2(inputs)
	if (locale === "es") return es_skillframeworks_browsefw2(inputs)
	if (locale === "fr") return fr_skillframeworks_browsefw2(inputs)
	return ar_skillframeworks_browsefw2(inputs)
});
export { skillframeworks_browsefw2 as "skillFrameworks.browseFw" }