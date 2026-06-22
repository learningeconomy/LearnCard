/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs */

const en_developerportal_credentialbuilder_achievementslist_creditsearned4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credits Earned`)
};

const es_developerportal_credentialbuilder_achievementslist_creditsearned4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créditos Obtenidos`)
};

const fr_developerportal_credentialbuilder_achievementslist_creditsearned4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crédits Obtenus`)
};

const ar_developerportal_credentialbuilder_achievementslist_creditsearned4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاعتمادات المكتسبة`)
};

/**
* | output |
* | --- |
* | "Credits Earned" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_creditsearned4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Creditsearned4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_creditsearned4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_creditsearned4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_creditsearned4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_creditsearned4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_creditsearned4 as "developerPortal.credentialBuilder.achievementsList.creditsEarned" }