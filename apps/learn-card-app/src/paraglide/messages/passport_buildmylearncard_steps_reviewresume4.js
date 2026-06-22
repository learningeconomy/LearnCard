/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Steps_Reviewresume4Inputs */

const en_passport_buildmylearncard_steps_reviewresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Reviewresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Resume`)
};

const es_passport_buildmylearncard_steps_reviewresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Reviewresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar currículum`)
};

const fr_passport_buildmylearncard_steps_reviewresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Reviewresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier le CV`)
};

const ar_passport_buildmylearncard_steps_reviewresume4 = /** @type {(inputs: Passport_Buildmylearncard_Steps_Reviewresume4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مراجعة السيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Review Resume" |
*
* @param {Passport_Buildmylearncard_Steps_Reviewresume4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_steps_reviewresume4 = /** @type {((inputs?: Passport_Buildmylearncard_Steps_Reviewresume4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Steps_Reviewresume4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_steps_reviewresume4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_steps_reviewresume4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_steps_reviewresume4(inputs)
	return ar_passport_buildmylearncard_steps_reviewresume4(inputs)
});
export { passport_buildmylearncard_steps_reviewresume4 as "passport.buildMyLearnCard.steps.reviewResume" }