/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Permissions_Credentialbyid_Description3Inputs */

const en_developerportal_permissions_credentialbyid_description3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve specific credentials by ID`)
};

const es_developerportal_permissions_credentialbyid_description3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve specific credentials by ID`)
};

const fr_developerportal_permissions_credentialbyid_description3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve specific credentials by ID`)
};

const ar_developerportal_permissions_credentialbyid_description3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve specific credentials by ID`)
};

/**
* | output |
* | --- |
* | "Retrieve specific credentials by ID" |
*
* @param {Developerportal_Permissions_Credentialbyid_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_permissions_credentialbyid_description3 = /** @type {((inputs?: Developerportal_Permissions_Credentialbyid_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Permissions_Credentialbyid_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_permissions_credentialbyid_description3(inputs)
	if (locale === "es") return es_developerportal_permissions_credentialbyid_description3(inputs)
	if (locale === "fr") return fr_developerportal_permissions_credentialbyid_description3(inputs)
	return ar_developerportal_permissions_credentialbyid_description3(inputs)
});
export { developerportal_permissions_credentialbyid_description3 as "developerPortal.permissions.credentialById.description" }