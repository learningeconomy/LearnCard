/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Createneworganization4Inputs */

const en_developerportal_components_accountselector_createneworganization4 = /** @type {(inputs: Developerportal_Components_Accountselector_Createneworganization4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New Organization`)
};

const es_developerportal_components_accountselector_createneworganization4 = /** @type {(inputs: Developerportal_Components_Accountselector_Createneworganization4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nueva Organización`)
};

const fr_developerportal_components_accountselector_createneworganization4 = /** @type {(inputs: Developerportal_Components_Accountselector_Createneworganization4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer Nouvelle Organisation`)
};

const ar_developerportal_components_accountselector_createneworganization4 = /** @type {(inputs: Developerportal_Components_Accountselector_Createneworganization4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مؤسسة جديدة`)
};

/**
* | output |
* | --- |
* | "Create New Organization" |
*
* @param {Developerportal_Components_Accountselector_Createneworganization4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_createneworganization4 = /** @type {((inputs?: Developerportal_Components_Accountselector_Createneworganization4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Createneworganization4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_createneworganization4(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_createneworganization4(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_createneworganization4(inputs)
	return ar_developerportal_components_accountselector_createneworganization4(inputs)
});
export { developerportal_components_accountselector_createneworganization4 as "developerPortal.components.accountSelector.createNewOrganization" }