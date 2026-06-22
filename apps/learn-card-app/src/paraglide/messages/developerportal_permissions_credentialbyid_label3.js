/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Permissions_Credentialbyid_Label3Inputs */

const en_developerportal_permissions_credentialbyid_label3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential by ID`)
};

const es_developerportal_permissions_credentialbyid_label3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential by ID`)
};

const fr_developerportal_permissions_credentialbyid_label3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential by ID`)
};

const ar_developerportal_permissions_credentialbyid_label3 = /** @type {(inputs: Developerportal_Permissions_Credentialbyid_Label3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential by ID`)
};

/**
* | output |
* | --- |
* | "Credential by ID" |
*
* @param {Developerportal_Permissions_Credentialbyid_Label3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_permissions_credentialbyid_label3 = /** @type {((inputs?: Developerportal_Permissions_Credentialbyid_Label3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Permissions_Credentialbyid_Label3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_permissions_credentialbyid_label3(inputs)
	if (locale === "es") return es_developerportal_permissions_credentialbyid_label3(inputs)
	if (locale === "fr") return fr_developerportal_permissions_credentialbyid_label3(inputs)
	return ar_developerportal_permissions_credentialbyid_label3(inputs)
});
export { developerportal_permissions_credentialbyid_label3 as "developerPortal.permissions.credentialById.label" }