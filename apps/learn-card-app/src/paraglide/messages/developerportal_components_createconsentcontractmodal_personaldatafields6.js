/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs */

const en_developerportal_components_createconsentcontractmodal_personaldatafields6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Data Fields`)
};

const es_developerportal_components_createconsentcontractmodal_personaldatafields6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Data Fields`)
};

const fr_developerportal_components_createconsentcontractmodal_personaldatafields6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Data Fields`)
};

const ar_developerportal_components_createconsentcontractmodal_personaldatafields6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Data Fields`)
};

/**
* | output |
* | --- |
* | "Personal Data Fields" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_personaldatafields6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Personaldatafields6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_personaldatafields6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_personaldatafields6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_personaldatafields6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_personaldatafields6(inputs)
});
export { developerportal_components_createconsentcontractmodal_personaldatafields6 as "developerPortal.components.createConsentContractModal.personalDataFields" }