/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Description4Inputs */

const en_developerportal_components_createconsentcontractmodal_description4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const es_developerportal_components_createconsentcontractmodal_description4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descripción`)
};

const fr_developerportal_components_createconsentcontractmodal_description4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const ar_developerportal_components_createconsentcontractmodal_description4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Description4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوصف`)
};

/**
* | output |
* | --- |
* | "Description" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Description4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_description4 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Description4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Description4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_description4(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_description4(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_description4(inputs)
	return ar_developerportal_components_createconsentcontractmodal_description4(inputs)
});
export { developerportal_components_createconsentcontractmodal_description4 as "developerPortal.components.createConsentContractModal.description" }