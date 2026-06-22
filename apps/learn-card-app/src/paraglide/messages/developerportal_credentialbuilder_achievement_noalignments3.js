/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs */

const en_developerportal_credentialbuilder_achievement_noalignments3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No alignments added`)
};

const es_developerportal_credentialbuilder_achievement_noalignments3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin alineaciones añadidas`)
};

const fr_developerportal_credentialbuilder_achievement_noalignments3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun alignement ajouté`)
};

const ar_developerportal_credentialbuilder_achievement_noalignments3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم تتم إضافة محاذاة`)
};

/**
* | output |
* | --- |
* | "No alignments added" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_noalignments3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Noalignments3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_noalignments3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_noalignments3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_noalignments3(inputs)
	return ar_developerportal_credentialbuilder_achievement_noalignments3(inputs)
});
export { developerportal_credentialbuilder_achievement_noalignments3 as "developerPortal.credentialBuilder.achievement.noAlignments" }