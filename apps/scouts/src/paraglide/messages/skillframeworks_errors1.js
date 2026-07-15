/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Errors1Inputs */

const en_skillframeworks_errors1 = /** @type {(inputs: Skillframeworks_Errors1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Errors`)
};

const es_skillframeworks_errors1 = /** @type {(inputs: Skillframeworks_Errors1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Errores`)
};

const fr_skillframeworks_errors1 = /** @type {(inputs: Skillframeworks_Errors1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreurs`)
};

const ar_skillframeworks_errors1 = /** @type {(inputs: Skillframeworks_Errors1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Errors`)
};

/**
* | output |
* | --- |
* | "Errors" |
*
* @param {Skillframeworks_Errors1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_errors1 = /** @type {((inputs?: Skillframeworks_Errors1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Errors1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_errors1(inputs)
	if (locale === "es") return es_skillframeworks_errors1(inputs)
	if (locale === "fr") return fr_skillframeworks_errors1(inputs)
	return ar_skillframeworks_errors1(inputs)
});
export { skillframeworks_errors1 as "skillFrameworks.errors" }