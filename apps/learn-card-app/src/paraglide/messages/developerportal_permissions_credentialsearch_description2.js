/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Permissions_Credentialsearch_Description2Inputs */

const en_developerportal_permissions_credentialsearch_description2 = /** @type {(inputs: Developerportal_Permissions_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user credentials`)
};

const es_developerportal_permissions_credentialsearch_description2 = /** @type {(inputs: Developerportal_Permissions_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user credentials`)
};

const fr_developerportal_permissions_credentialsearch_description2 = /** @type {(inputs: Developerportal_Permissions_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user credentials`)
};

const ar_developerportal_permissions_credentialsearch_description2 = /** @type {(inputs: Developerportal_Permissions_Credentialsearch_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search user credentials`)
};

/**
* | output |
* | --- |
* | "Search user credentials" |
*
* @param {Developerportal_Permissions_Credentialsearch_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_permissions_credentialsearch_description2 = /** @type {((inputs?: Developerportal_Permissions_Credentialsearch_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Permissions_Credentialsearch_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_permissions_credentialsearch_description2(inputs)
	if (locale === "es") return es_developerportal_permissions_credentialsearch_description2(inputs)
	if (locale === "fr") return fr_developerportal_permissions_credentialsearch_description2(inputs)
	return ar_developerportal_permissions_credentialsearch_description2(inputs)
});
export { developerportal_permissions_credentialsearch_description2 as "developerPortal.permissions.credentialSearch.description" }