/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Createorganization3Inputs */

const en_developerportal_components_accountselector_createorganization3 = /** @type {(inputs: Developerportal_Components_Accountselector_Createorganization3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Organization`)
};

const es_developerportal_components_accountselector_createorganization3 = /** @type {(inputs: Developerportal_Components_Accountselector_Createorganization3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Organización`)
};

const fr_developerportal_components_accountselector_createorganization3 = /** @type {(inputs: Developerportal_Components_Accountselector_Createorganization3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Organisation`)
};

const ar_developerportal_components_accountselector_createorganization3 = /** @type {(inputs: Developerportal_Components_Accountselector_Createorganization3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مؤسسة`)
};

/**
* | output |
* | --- |
* | "Create Organization" |
*
* @param {Developerportal_Components_Accountselector_Createorganization3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_createorganization3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Createorganization3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Createorganization3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_createorganization3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_createorganization3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_createorganization3(inputs)
	return ar_developerportal_components_accountselector_createorganization3(inputs)
});
export { developerportal_components_accountselector_createorganization3 as "developerPortal.components.accountSelector.createOrganization" }