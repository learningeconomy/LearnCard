/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs */

const en_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., A, 95%, 3.8 GPA`)
};

const es_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., A, 95%, 3.8 GPA`)
};

const fr_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., A, 95%, 3.8 GPA`)
};

const ar_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: A, 95%, 3.8 GPA`)
};

/**
* | output |
* | --- |
* | "e.g., A, 95%, 3.8 GPA" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Resultvalueplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_resultvalueplaceholder5 as "developerPortal.credentialBuilder.achievementsList.resultValuePlaceholder" }