/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs */

const en_developerportal_credentialbuilder_achievementslist_someerrors4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some achievements have validation errors`)
};

const es_developerportal_credentialbuilder_achievementslist_someerrors4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algunos logros tienen errores de validación`)
};

const fr_developerportal_credentialbuilder_achievementslist_someerrors4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certaines réalisations ont des erreurs de validation`)
};

const ar_developerportal_credentialbuilder_achievementslist_someerrors4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعض الإنجازات بها أخطاء تحقق`)
};

/**
* | output |
* | --- |
* | "Some achievements have validation errors" |
*
* @param {Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievementslist_someerrors4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievementslist_Someerrors4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievementslist_someerrors4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievementslist_someerrors4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievementslist_someerrors4(inputs)
	return ar_developerportal_credentialbuilder_achievementslist_someerrors4(inputs)
});
export { developerportal_credentialbuilder_achievementslist_someerrors4 as "developerPortal.credentialBuilder.achievementsList.someErrors" }