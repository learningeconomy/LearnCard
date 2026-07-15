/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Framework1Inputs */

const en_skillframeworks_framework1 = /** @type {(inputs: Skillframeworks_Framework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework`)
};

const es_skillframeworks_framework1 = /** @type {(inputs: Skillframeworks_Framework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Marco`)
};

const fr_skillframeworks_framework1 = /** @type {(inputs: Skillframeworks_Framework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cadre`)
};

const ar_skillframeworks_framework1 = /** @type {(inputs: Skillframeworks_Framework1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework`)
};

/**
* | output |
* | --- |
* | "Framework" |
*
* @param {Skillframeworks_Framework1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_framework1 = /** @type {((inputs?: Skillframeworks_Framework1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Framework1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_framework1(inputs)
	if (locale === "es") return es_skillframeworks_framework1(inputs)
	if (locale === "fr") return fr_skillframeworks_framework1(inputs)
	return ar_skillframeworks_framework1(inputs)
});
export { skillframeworks_framework1 as "skillFrameworks.framework" }