/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Review_Subtitle3Inputs */

const en_passport_buildmylearncard_review_subtitle3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the credentials you'd like to add to your LearnCard.`)
};

const es_passport_buildmylearncard_review_subtitle3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona las credenciales que quieres añadir a tu LearnCard.`)
};

const fr_passport_buildmylearncard_review_subtitle3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez les justificatifs que vous souhaitez ajouter à votre LearnCard.`)
};

const ar_passport_buildmylearncard_review_subtitle3 = /** @type {(inputs: Passport_Buildmylearncard_Review_Subtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر بيانات الاعتماد التي تريد إضافتها إلى LearnCard.`)
};

/**
* | output |
* | --- |
* | "Select the credentials you'd like to add to your LearnCard." |
*
* @param {Passport_Buildmylearncard_Review_Subtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_review_subtitle3 = /** @type {((inputs?: Passport_Buildmylearncard_Review_Subtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Review_Subtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_review_subtitle3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_review_subtitle3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_review_subtitle3(inputs)
	return ar_passport_buildmylearncard_review_subtitle3(inputs)
});
export { passport_buildmylearncard_review_subtitle3 as "passport.buildMyLearnCard.review.subtitle" }