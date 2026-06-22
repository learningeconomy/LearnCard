/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs */

const en_developerportal_credentialbuilder_achievementslist_addresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Result`)
};

const es_developerportal_credentialbuilder_achievementslist_addresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir Resultado`)
};

const fr_developerportal_credentialbuilder_achievementslist_addresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un Résultat`)
};

const ar_developerportal_credentialbuilder_achievementslist_addresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة نتيجة`)
};

/**
* | output |
* | --- |
* | "Add Result" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_addresult4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Addresult4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_addresult4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_addresult4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_addresult4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_addresult4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_addresult4 as "developerPortal.credentialBuilder.achievementsList.addResult" }