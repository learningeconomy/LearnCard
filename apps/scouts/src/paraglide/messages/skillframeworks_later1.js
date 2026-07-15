/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Later1Inputs */

const en_skillframeworks_later1 = /** @type {(inputs: Skillframeworks_Later1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Later`)
};

const es_skillframeworks_later1 = /** @type {(inputs: Skillframeworks_Later1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Después`)
};

const fr_skillframeworks_later1 = /** @type {(inputs: Skillframeworks_Later1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plus tard`)
};

const ar_skillframeworks_later1 = /** @type {(inputs: Skillframeworks_Later1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لاحقاً`)
};

/**
* | output |
* | --- |
* | "Later" |
*
* @param {Skillframeworks_Later1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_later1 = /** @type {((inputs?: Skillframeworks_Later1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Later1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_later1(inputs)
	if (locale === "es") return es_skillframeworks_later1(inputs)
	if (locale === "fr") return fr_skillframeworks_later1(inputs)
	return ar_skillframeworks_later1(inputs)
});
export { skillframeworks_later1 as "skillFrameworks.later" }