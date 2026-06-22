/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs */

const en_developerportal_components_createconsentcontractmodal_reasonforaccessing6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reason for Accessing`)
};

const es_developerportal_components_createconsentcontractmodal_reasonforaccessing6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Motivo de Acceso`)
};

const fr_developerportal_components_createconsentcontractmodal_reasonforaccessing6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Raison d'Accès`)
};

const ar_developerportal_components_createconsentcontractmodal_reasonforaccessing6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سبب الوصول`)
};

/**
* | output |
* | --- |
* | "Reason for Accessing" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_reasonforaccessing6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Reasonforaccessing6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_reasonforaccessing6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_reasonforaccessing6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_reasonforaccessing6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_reasonforaccessing6(inputs)
});
export { developerportal_components_createconsentcontractmodal_reasonforaccessing6 as "developerPortal.components.createConsentContractModal.reasonForAccessing" }