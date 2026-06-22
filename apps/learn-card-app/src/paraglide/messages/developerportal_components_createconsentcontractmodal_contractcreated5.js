/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs */

const en_developerportal_components_createconsentcontractmodal_contractcreated5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contract "${i?.name}" created successfully!`)
};

const es_developerportal_components_createconsentcontractmodal_contractcreated5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contract "${i?.name}" created successfully!`)
};

const fr_developerportal_components_createconsentcontractmodal_contractcreated5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contract "${i?.name}" created successfully!`)
};

const ar_developerportal_components_createconsentcontractmodal_contractcreated5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Contract "${i?.name}" created successfully!`)
};

/**
* | output |
* | --- |
* | "Contract \"{name}\" created successfully!" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_contractcreated5 = /** @type {((inputs: Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Contractcreated5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_contractcreated5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_contractcreated5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_contractcreated5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_contractcreated5(inputs)
});
export { developerportal_components_createconsentcontractmodal_contractcreated5 as "developerPortal.components.createConsentContractModal.contractCreated" }