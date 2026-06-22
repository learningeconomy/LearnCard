/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs */

const en_passport_buildmylearncard_achievementmodal_searchplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search achievement types...`)
};

const es_passport_buildmylearncard_achievementmodal_searchplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar tipos de logro...`)
};

const fr_passport_buildmylearncard_achievementmodal_searchplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des types de réussite...`)
};

const ar_passport_buildmylearncard_achievementmodal_searchplaceholder5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث في أنواع الإنجاز...`)
};

/**
* | output |
* | --- |
* | "Search achievement types..." |
*
* @param {Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_achievementmodal_searchplaceholder5 = /** @type {((inputs?: Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Achievementmodal_Searchplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_achievementmodal_searchplaceholder5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_achievementmodal_searchplaceholder5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_achievementmodal_searchplaceholder5(inputs)
	return ar_passport_buildmylearncard_achievementmodal_searchplaceholder5(inputs)
});
export { passport_buildmylearncard_achievementmodal_searchplaceholder5 as "passport.buildMyLearnCard.achievementModal.searchPlaceholder" }