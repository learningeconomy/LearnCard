/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Organizationname3Inputs */

const en_developerportal_components_accountselector_organizationname3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organization Name`)
};

const es_developerportal_components_accountselector_organizationname3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de Organización`)
};

const fr_developerportal_components_accountselector_organizationname3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'Organisation`)
};

const ar_developerportal_components_accountselector_organizationname3 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المؤسسة`)
};

/**
* | output |
* | --- |
* | "Organization Name" |
*
* @param {Developerportal_Components_Accountselector_Organizationname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_organizationname3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Organizationname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Organizationname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_organizationname3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_organizationname3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_organizationname3(inputs)
	return ar_developerportal_components_accountselector_organizationname3(inputs)
});
export { developerportal_components_accountselector_organizationname3 as "developerPortal.components.accountSelector.organizationName" }