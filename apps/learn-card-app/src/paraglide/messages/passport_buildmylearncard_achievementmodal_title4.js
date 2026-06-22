/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Achievementmodal_Title4Inputs */

const en_passport_buildmylearncard_achievementmodal_title4 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Achievement Type`)
};

const es_passport_buildmylearncard_achievementmodal_title4 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar tipo de logro`)
};

const fr_passport_buildmylearncard_achievementmodal_title4 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le type de réussite`)
};

const ar_passport_buildmylearncard_achievementmodal_title4 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار نوع الإنجاز`)
};

/**
* | output |
* | --- |
* | "Select Achievement Type" |
*
* @param {Passport_Buildmylearncard_Achievementmodal_Title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_achievementmodal_title4 = /** @type {((inputs?: Passport_Buildmylearncard_Achievementmodal_Title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Achievementmodal_Title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_achievementmodal_title4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_achievementmodal_title4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_achievementmodal_title4(inputs)
	return ar_passport_buildmylearncard_achievementmodal_title4(inputs)
});
export { passport_buildmylearncard_achievementmodal_title4 as "passport.buildMyLearnCard.achievementModal.title" }