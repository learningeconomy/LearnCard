/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs */

const en_developerportal_components_createconsentcontractmodal_descriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what your app does and why it needs access...`)
};

const es_developerportal_components_createconsentcontractmodal_descriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what your app does and why it needs access...`)
};

const fr_developerportal_components_createconsentcontractmodal_descriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what your app does and why it needs access...`)
};

const ar_developerportal_components_createconsentcontractmodal_descriptionplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Describe what your app does and why it needs access...`)
};

/**
* | output |
* | --- |
* | "Describe what your app does and why it needs access..." |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_descriptionplaceholder5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Descriptionplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_descriptionplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_descriptionplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_descriptionplaceholder5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_descriptionplaceholder5(inputs)
});
export { developerportal_components_createconsentcontractmodal_descriptionplaceholder5 as "developerPortal.components.createConsentContractModal.descriptionPlaceholder" }