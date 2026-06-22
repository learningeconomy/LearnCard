/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs */

const en_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fix the errors above before saving.`)
};

const es_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrige los errores antes de guardar.`)
};

const fr_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Corrigez les erreurs avant d'enregistrer.`)
};

const ar_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صحح الأخطاء أعلاه قبل الحفظ.`)
};

/**
* | output |
* | --- |
* | "Fix the errors above before saving." |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Fixerrorsbeforesave6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6(inputs)
});
export { developerportal_credentialbuilder_achievementslist_fixerrorsbeforesave6 as "developerPortal.credentialBuilder.achievementsList.fixErrorsBeforeSave" }