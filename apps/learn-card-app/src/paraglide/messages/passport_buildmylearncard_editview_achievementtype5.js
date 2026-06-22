/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Editview_Achievementtype5Inputs */

const en_passport_buildmylearncard_editview_achievementtype5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Achievementtype5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Achievement Type`)
};

const es_passport_buildmylearncard_editview_achievementtype5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Achievementtype5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo de logro`)
};

const fr_passport_buildmylearncard_editview_achievementtype5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Achievementtype5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type de réussite`)
};

const ar_passport_buildmylearncard_editview_achievementtype5 = /** @type {(inputs: Passport_Buildmylearncard_Editview_Achievementtype5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع الإنجاز`)
};

/**
* | output |
* | --- |
* | "Achievement Type" |
*
* @param {Passport_Buildmylearncard_Editview_Achievementtype5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_editview_achievementtype5 = /** @type {((inputs?: Passport_Buildmylearncard_Editview_Achievementtype5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Editview_Achievementtype5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_editview_achievementtype5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_editview_achievementtype5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_editview_achievementtype5(inputs)
	return ar_passport_buildmylearncard_editview_achievementtype5(inputs)
});
export { passport_buildmylearncard_editview_achievementtype5 as "passport.buildMyLearnCard.editView.achievementType" }