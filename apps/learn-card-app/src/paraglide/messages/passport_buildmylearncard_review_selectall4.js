/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Review_Selectall4Inputs */

const en_passport_buildmylearncard_review_selectall4 = /** @type {(inputs: Passport_Buildmylearncard_Review_Selectall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select All`)
};

const es_passport_buildmylearncard_review_selectall4 = /** @type {(inputs: Passport_Buildmylearncard_Review_Selectall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar todo`)
};

const fr_passport_buildmylearncard_review_selectall4 = /** @type {(inputs: Passport_Buildmylearncard_Review_Selectall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout sélectionner`)
};

const ar_passport_buildmylearncard_review_selectall4 = /** @type {(inputs: Passport_Buildmylearncard_Review_Selectall4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديد الكل`)
};

/**
* | output |
* | --- |
* | "Select All" |
*
* @param {Passport_Buildmylearncard_Review_Selectall4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_review_selectall4 = /** @type {((inputs?: Passport_Buildmylearncard_Review_Selectall4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Review_Selectall4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_review_selectall4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_review_selectall4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_review_selectall4(inputs)
	return ar_passport_buildmylearncard_review_selectall4(inputs)
});
export { passport_buildmylearncard_review_selectall4 as "passport.buildMyLearnCard.review.selectAll" }