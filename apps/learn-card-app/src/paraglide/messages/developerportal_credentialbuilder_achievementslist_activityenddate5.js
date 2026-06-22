/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs */

const en_developerportal_credentialbuilder_achievementslist_activityenddate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activity End Date`)
};

const es_developerportal_credentialbuilder_achievementslist_activityenddate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de Fin de Actividad`)
};

const fr_developerportal_credentialbuilder_achievementslist_activityenddate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de Fin d'Activité`)
};

const ar_developerportal_credentialbuilder_achievementslist_activityenddate5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ انتهاء النشاط`)
};

/**
* | output |
* | --- |
* | "Activity End Date" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_activityenddate5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Activityenddate5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_activityenddate5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_activityenddate5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_activityenddate5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_activityenddate5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_activityenddate5 as "developerPortal.credentialBuilder.achievementsList.activityEndDate" }