/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs */

const en_developerportal_components_createconsentcontractmodal_contractnamerequired6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract name is required`)
};

const es_developerportal_components_createconsentcontractmodal_contractnamerequired6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El nombre del contrato es requerido`)
};

const fr_developerportal_components_createconsentcontractmodal_contractnamerequired6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le nom du contrat est requis`)
};

const ar_developerportal_components_createconsentcontractmodal_contractnamerequired6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم العقد مطلوب`)
};

/**
* | output |
* | --- |
* | "Contract name is required" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_contractnamerequired6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Contractnamerequired6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_contractnamerequired6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_contractnamerequired6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_contractnamerequired6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_contractnamerequired6(inputs)
});
export { developerportal_components_createconsentcontractmodal_contractnamerequired6 as "developerPortal.components.createConsentContractModal.contractNameRequired" }