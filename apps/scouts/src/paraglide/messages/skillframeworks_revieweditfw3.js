/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Revieweditfw3Inputs */

const en_skillframeworks_revieweditfw3 = /** @type {(inputs: Skillframeworks_Revieweditfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review & Edit Framework`)
};

const es_skillframeworks_revieweditfw3 = /** @type {(inputs: Skillframeworks_Revieweditfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar y Editar Marco`)
};

const fr_skillframeworks_revieweditfw3 = /** @type {(inputs: Skillframeworks_Revieweditfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réviser et modifier le cadre`)
};

const ar_skillframeworks_revieweditfw3 = /** @type {(inputs: Skillframeworks_Revieweditfw3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review & Edit Framework`)
};

/**
* | output |
* | --- |
* | "Review & Edit Framework" |
*
* @param {Skillframeworks_Revieweditfw3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_revieweditfw3 = /** @type {((inputs?: Skillframeworks_Revieweditfw3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Revieweditfw3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_revieweditfw3(inputs)
	if (locale === "es") return es_skillframeworks_revieweditfw3(inputs)
	if (locale === "fr") return fr_skillframeworks_revieweditfw3(inputs)
	return ar_skillframeworks_revieweditfw3(inputs)
});
export { skillframeworks_revieweditfw3 as "skillFrameworks.reviewEditFw" }