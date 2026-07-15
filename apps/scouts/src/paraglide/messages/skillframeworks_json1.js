/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Json1Inputs */

const en_skillframeworks_json1 = /** @type {(inputs: Skillframeworks_Json1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const es_skillframeworks_json1 = /** @type {(inputs: Skillframeworks_Json1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const fr_skillframeworks_json1 = /** @type {(inputs: Skillframeworks_Json1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

const ar_skillframeworks_json1 = /** @type {(inputs: Skillframeworks_Json1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`JSON`)
};

/**
* | output |
* | --- |
* | "JSON" |
*
* @param {Skillframeworks_Json1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_json1 = /** @type {((inputs?: Skillframeworks_Json1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Json1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_json1(inputs)
	if (locale === "es") return es_skillframeworks_json1(inputs)
	if (locale === "fr") return fr_skillframeworks_json1(inputs)
	return ar_skillframeworks_json1(inputs)
});
export { skillframeworks_json1 as "skillFrameworks.json" }