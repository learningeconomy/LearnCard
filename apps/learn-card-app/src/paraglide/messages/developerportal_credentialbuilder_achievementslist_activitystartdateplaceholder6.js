/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs */

const en_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., 2024-01-15`)
};

const es_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., 2024-01-15`)
};

const fr_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., 2024-01-15`)
};

const ar_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: 2024-01-15`)
};

/**
* | output |
* | --- |
* | "e.g., 2024-01-15" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Activitystartdateplaceholder6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6(inputs)
});
export { developerportal_credentialbuilder_achievementslist_activitystartdateplaceholder6 as "developerPortal.credentialBuilder.achievementsList.activityStartDatePlaceholder" }