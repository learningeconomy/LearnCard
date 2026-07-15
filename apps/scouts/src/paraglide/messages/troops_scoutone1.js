/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Scoutone1Inputs */

const en_troops_scoutone1 = /** @type {(inputs: Troops_Scoutone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const es_troops_scoutone1 = /** @type {(inputs: Troops_Scoutone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const fr_troops_scoutone1 = /** @type {(inputs: Troops_Scoutone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

const ar_troops_scoutone1 = /** @type {(inputs: Troops_Scoutone1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scout`)
};

/**
* | output |
* | --- |
* | "Scout" |
*
* @param {Troops_Scoutone1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_scoutone1 = /** @type {((inputs?: Troops_Scoutone1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Scoutone1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_scoutone1(inputs)
	if (locale === "es") return es_troops_scoutone1(inputs)
	if (locale === "fr") return fr_troops_scoutone1(inputs)
	return ar_troops_scoutone1(inputs)
});
export { troops_scoutone1 as "troops.scoutOne" }