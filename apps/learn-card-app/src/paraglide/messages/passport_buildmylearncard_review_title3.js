/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Review_Title3Inputs */

const en_passport_buildmylearncard_review_title3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Extracted Credentials`)
};

const es_passport_buildmylearncard_review_title3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisar credenciales extraídas`)
};

const fr_passport_buildmylearncard_review_title3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier les justificatifs extraits`)
};

const ar_passport_buildmylearncard_review_title3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مراجعة بيانات الاعتماد المستخرجة`)
};

/**
* | output |
* | --- |
* | "Review Extracted Credentials" |
*
* @param {Passport_Buildmylearncard_Review_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_review_title3 = /** @type {((inputs?: Passport_Buildmylearncard_Review_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Review_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_review_title3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_review_title3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_review_title3(inputs)
	return ar_passport_buildmylearncard_review_title3(inputs)
});
export { passport_buildmylearncard_review_title3 as "passport.buildMyLearnCard.review.title" }