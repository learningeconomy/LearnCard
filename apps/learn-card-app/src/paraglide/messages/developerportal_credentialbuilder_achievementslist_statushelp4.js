/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs */

const en_developerportal_credentialbuilder_achievementslist_statushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Completion status`)
};

const es_developerportal_credentialbuilder_achievementslist_statushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado de finalización`)
};

const fr_developerportal_credentialbuilder_achievementslist_statushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut d'achèvement`)
};

const ar_developerportal_credentialbuilder_achievementslist_statushelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حالة الإكمال`)
};

/**
* | output |
* | --- |
* | "Completion status" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_statushelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Statushelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_statushelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_statushelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_statushelp4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_statushelp4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_statushelp4 as "developerPortal.credentialBuilder.achievementsList.statusHelp" }