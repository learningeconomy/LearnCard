/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs */

const en_developerportal_components_createconsentcontractmodal_advancedoptions5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Advanced Options`)
};

const es_developerportal_components_createconsentcontractmodal_advancedoptions5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opciones Avanzadas`)
};

const fr_developerportal_components_createconsentcontractmodal_advancedoptions5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Options Avancées`)
};

const ar_developerportal_components_createconsentcontractmodal_advancedoptions5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خيارات متقدمة`)
};

/**
* | output |
* | --- |
* | "Advanced Options" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_advancedoptions5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Advancedoptions5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_advancedoptions5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_advancedoptions5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_advancedoptions5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_advancedoptions5(inputs)
});
export { developerportal_components_createconsentcontractmodal_advancedoptions5 as "developerPortal.components.createConsentContractModal.advancedOptions" }