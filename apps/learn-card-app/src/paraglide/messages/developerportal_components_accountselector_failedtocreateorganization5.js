/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs */

const en_developerportal_components_accountselector_failedtocreateorganization5 = /** @type {(inputs: Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create organization: ${i?.message}`)
};

const es_developerportal_components_accountselector_failedtocreateorganization5 = /** @type {(inputs: Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al crear organización: ${i?.message}`)
};

const fr_developerportal_components_accountselector_failedtocreateorganization5 = /** @type {(inputs: Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de création de l'organisation : ${i?.message}`)
};

const ar_developerportal_components_accountselector_failedtocreateorganization5 = /** @type {(inputs: Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل في إنشاء المؤسسة: ${i?.message}`)
};

/**
* | output |
* | --- |
* | "Failed to create organization: {message}" |
*
* @param {Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_failedtocreateorganization5 = /** @type {((inputs: Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Failedtocreateorganization5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_failedtocreateorganization5(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_failedtocreateorganization5(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_failedtocreateorganization5(inputs)
	return ar_developerportal_components_accountselector_failedtocreateorganization5(inputs)
});
export { developerportal_components_accountselector_failedtocreateorganization5 as "developerPortal.components.accountSelector.failedToCreateOrganization" }