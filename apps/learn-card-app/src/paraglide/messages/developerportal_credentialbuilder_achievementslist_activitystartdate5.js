/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs */

const en_developerportal_credentialbuilder_achievementslist_activitystartdate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity Start Date`)
};

const es_developerportal_credentialbuilder_achievementslist_activitystartdate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Inicio de Actividad`)
};

const fr_developerportal_credentialbuilder_achievementslist_activitystartdate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Début d'Activité`)
};

const ar_developerportal_credentialbuilder_achievementslist_activitystartdate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ بدء النشاط`)
};

/**
* | output |
* | --- |
* | "Activity Start Date" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_activitystartdate5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Activitystartdate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_activitystartdate5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_activitystartdate5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_activitystartdate5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_activitystartdate5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_activitystartdate5 as "developerPortal.credentialBuilder.achievementsList.activityStartDate" }