/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs */

const en_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions`)
};

const es_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos`)
};

const fr_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorisations`)
};

const ar_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأذونات`)
};

/**
* | output |
* | --- |
* | "Permissions" |
*
* @param {Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Apitokenstep_Permissionslabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5(inputs)
	return ar_developerportal_guides_issuecredentials_apitokenstep_permissionslabel5(inputs)
});
export { developerportal_guides_issuecredentials_apitokenstep_permissionslabel5 as "developerPortal.guides.issueCredentials.apiTokenStep.permissionsLabel" }