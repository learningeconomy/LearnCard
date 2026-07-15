/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Reviewfw2Inputs */

const en_skillframeworks_reviewfw2 = /** @type {(inputs: Skillframeworks_Reviewfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Framework`)
};

const es_skillframeworks_reviewfw2 = /** @type {(inputs: Skillframeworks_Reviewfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar Marco`)
};

const fr_skillframeworks_reviewfw2 = /** @type {(inputs: Skillframeworks_Reviewfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réviser le cadre`)
};

const ar_skillframeworks_reviewfw2 = /** @type {(inputs: Skillframeworks_Reviewfw2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مراجعة الإطار`)
};

/**
* | output |
* | --- |
* | "Review Framework" |
*
* @param {Skillframeworks_Reviewfw2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_reviewfw2 = /** @type {((inputs?: Skillframeworks_Reviewfw2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Reviewfw2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_reviewfw2(inputs)
	if (locale === "es") return es_skillframeworks_reviewfw2(inputs)
	if (locale === "fr") return fr_skillframeworks_reviewfw2(inputs)
	return ar_skillframeworks_reviewfw2(inputs)
});
export { skillframeworks_reviewfw2 as "skillFrameworks.reviewFw" }