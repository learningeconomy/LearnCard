/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs */

const en_developerportal_credentialbuilder_achievementslist_activityenddatehelp6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When the activity ended`)
};

const es_developerportal_credentialbuilder_achievementslist_activityenddatehelp6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuándo terminó la actividad`)
};

const fr_developerportal_credentialbuilder_achievementslist_activityenddatehelp6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand l'activité s'est terminée`)
};

const ar_developerportal_credentialbuilder_achievementslist_activityenddatehelp6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متى انتهى النشاط`)
};

/**
* | output |
* | --- |
* | "When the activity ended" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_activityenddatehelp6 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Activityenddatehelp6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_activityenddatehelp6(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_activityenddatehelp6(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_activityenddatehelp6(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_activityenddatehelp6(inputs)
});
export { developerportal_credentialbuilder_achievementslist_activityenddatehelp6 as "developerPortal.credentialBuilder.achievementsList.activityEndDateHelp" }