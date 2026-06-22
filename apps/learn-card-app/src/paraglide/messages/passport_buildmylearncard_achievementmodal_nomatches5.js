/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs */

const en_passport_buildmylearncard_achievementmodal_nomatches5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No matching types found`)
};

const es_passport_buildmylearncard_achievementmodal_nomatches5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron tipos coincidentes`)
};

const fr_passport_buildmylearncard_achievementmodal_nomatches5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun type correspondant trouvé`)
};

const ar_passport_buildmylearncard_achievementmodal_nomatches5 = /** @type {(inputs: Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يُعثر على أنواع مطابقة`)
};

/**
* | output |
* | --- |
* | "No matching types found" |
*
* @param {Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_achievementmodal_nomatches5 = /** @type {((inputs?: Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Achievementmodal_Nomatches5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_achievementmodal_nomatches5(inputs)
	if (locale === "es") return es_passport_buildmylearncard_achievementmodal_nomatches5(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_achievementmodal_nomatches5(inputs)
	return ar_passport_buildmylearncard_achievementmodal_nomatches5(inputs)
});
export { passport_buildmylearncard_achievementmodal_nomatches5 as "passport.buildMyLearnCard.achievementModal.noMatches" }