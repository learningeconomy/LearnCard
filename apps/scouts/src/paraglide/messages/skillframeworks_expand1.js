/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Expand1Inputs */

const en_skillframeworks_expand1 = /** @type {(inputs: Skillframeworks_Expand1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expand`)
};

const es_skillframeworks_expand1 = /** @type {(inputs: Skillframeworks_Expand1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expandir`)
};

const fr_skillframeworks_expand1 = /** @type {(inputs: Skillframeworks_Expand1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développer`)
};

const ar_skillframeworks_expand1 = /** @type {(inputs: Skillframeworks_Expand1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توسيع`)
};

/**
* | output |
* | --- |
* | "Expand" |
*
* @param {Skillframeworks_Expand1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_expand1 = /** @type {((inputs?: Skillframeworks_Expand1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Expand1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_expand1(inputs)
	if (locale === "es") return es_skillframeworks_expand1(inputs)
	if (locale === "fr") return fr_skillframeworks_expand1(inputs)
	return ar_skillframeworks_expand1(inputs)
});
export { skillframeworks_expand1 as "skillFrameworks.expand" }