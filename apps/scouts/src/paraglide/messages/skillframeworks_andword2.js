/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Andword2Inputs */

const en_skillframeworks_andword2 = /** @type {(inputs: Skillframeworks_Andword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` and `)
};

const es_skillframeworks_andword2 = /** @type {(inputs: Skillframeworks_Andword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` y `)
};

const fr_skillframeworks_andword2 = /** @type {(inputs: Skillframeworks_Andword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` et `)
};

const ar_skillframeworks_andword2 = /** @type {(inputs: Skillframeworks_Andword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (` and `)
};

/**
* | output |
* | --- |
* | "and" |
*
* @param {Skillframeworks_Andword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_andword2 = /** @type {((inputs?: Skillframeworks_Andword2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Andword2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_andword2(inputs)
	if (locale === "es") return es_skillframeworks_andword2(inputs)
	if (locale === "fr") return fr_skillframeworks_andword2(inputs)
	return ar_skillframeworks_andword2(inputs)
});
export { skillframeworks_andword2 as "skillFrameworks.andWord" }