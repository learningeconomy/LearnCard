/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs */

const en_developerportal_components_createconsentcontractmodal_contractlabel5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract`)
};

const es_developerportal_components_createconsentcontractmodal_contractlabel5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato`)
};

const fr_developerportal_components_createconsentcontractmodal_contractlabel5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat`)
};

const ar_developerportal_components_createconsentcontractmodal_contractlabel5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد`)
};

/**
* | output |
* | --- |
* | "Contract" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_contractlabel5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Contractlabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_contractlabel5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_contractlabel5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_contractlabel5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_contractlabel5(inputs)
});
export { developerportal_components_createconsentcontractmodal_contractlabel5 as "developerPortal.components.createConsentContractModal.contractLabel" }