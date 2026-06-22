/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs */

const en_developerportal_credentialbuilder_achievementslist_entrydetails4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entry Details`)
};

const es_developerportal_credentialbuilder_achievementslist_entrydetails4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles de la Entrada`)
};

const fr_developerportal_credentialbuilder_achievementslist_entrydetails4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails de l'Entrée`)
};

const ar_developerportal_credentialbuilder_achievementslist_entrydetails4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل الإدخال`)
};

/**
* | output |
* | --- |
* | "Entry Details" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_entrydetails4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Entrydetails4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_entrydetails4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_entrydetails4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_entrydetails4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_entrydetails4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_entrydetails4 as "developerPortal.credentialBuilder.achievementsList.entryDetails" }