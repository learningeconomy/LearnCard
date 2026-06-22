/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Passport_Buildmylearncard_Review_Save3Inputs */

const en_passport_buildmylearncard_review_save3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Save3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Save (${i?.count})`)
};

const es_passport_buildmylearncard_review_save3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Save3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Guardar (${i?.count})`)
};

const fr_passport_buildmylearncard_review_save3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Save3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Enregistrer (${i?.count})`)
};

const ar_passport_buildmylearncard_review_save3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Save3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حفظ (${i?.count})`)
};

/**
* | output |
* | --- |
* | "Save ({count})" |
*
* @param {Passport_Buildmylearncard_Review_Save3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_review_save3 = /** @type {((inputs: Passport_Buildmylearncard_Review_Save3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Review_Save3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_review_save3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_review_save3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_review_save3(inputs)
	return ar_passport_buildmylearncard_review_save3(inputs)
});
export { passport_buildmylearncard_review_save3 as "passport.buildMyLearnCard.review.save" }