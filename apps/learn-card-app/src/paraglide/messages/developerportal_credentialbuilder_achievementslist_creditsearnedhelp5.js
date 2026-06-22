/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs */

const en_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of credits earned for this achievement`)
};

const es_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de créditos obtenidos para este logro`)
};

const fr_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de crédits obtenus pour cette réalisation`)
};

const ar_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عدد الاعتمادات المكتسبة لهذا الإنجاز`)
};

/**
* | output |
* | --- |
* | "Number of credits earned for this achievement" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Creditsearnedhelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_creditsearnedhelp5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_creditsearnedhelp5 as "developerPortal.credentialBuilder.achievementsList.creditsEarnedHelp" }