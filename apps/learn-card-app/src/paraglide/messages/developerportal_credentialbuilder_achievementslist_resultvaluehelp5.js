/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs */

const en_developerportal_credentialbuilder_achievementslist_resultvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The achieved value`)
};

const es_developerportal_credentialbuilder_achievementslist_resultvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El valor obtenido`)
};

const fr_developerportal_credentialbuilder_achievementslist_resultvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La valeur obtenue`)
};

const ar_developerportal_credentialbuilder_achievementslist_resultvaluehelp5 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`القيمة المحققة`)
};

/**
* | output |
* | --- |
* | "The achieved value" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_resultvaluehelp5 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Resultvaluehelp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_resultvaluehelp5(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_resultvaluehelp5(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_resultvaluehelp5(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_resultvaluehelp5(inputs)
});
export { developerportal_credentialbuilder_achievementslist_resultvaluehelp5 as "developerPortal.credentialBuilder.achievementsList.resultValueHelp" }