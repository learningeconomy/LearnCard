/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs */

const en_developerportal_credentialbuilder_achievementslist_removeresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove result`)
};

const es_developerportal_credentialbuilder_achievementslist_removeresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar resultado`)
};

const fr_developerportal_credentialbuilder_achievementslist_removeresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le résultat`)
};

const ar_developerportal_credentialbuilder_achievementslist_removeresult4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة النتيجة`)
};

/**
* | output |
* | --- |
* | "Remove result" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_removeresult4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Removeresult4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_removeresult4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_removeresult4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_removeresult4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_removeresult4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_removeresult4 as "developerPortal.credentialBuilder.achievementsList.removeResult" }