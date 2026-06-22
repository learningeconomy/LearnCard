/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs */

const en_developerportal_components_createconsentcontractmodal_failedtocreate6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create contract: ${i?.message}`)
};

const es_developerportal_components_createconsentcontractmodal_failedtocreate6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create contract: ${i?.message}`)
};

const fr_developerportal_components_createconsentcontractmodal_failedtocreate6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create contract: ${i?.message}`)
};

const ar_developerportal_components_createconsentcontractmodal_failedtocreate6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to create contract: ${i?.message}`)
};

/**
* | output |
* | --- |
* | "Failed to create contract: {message}" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_failedtocreate6 = /** @type {((inputs: Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Failedtocreate6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_failedtocreate6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_failedtocreate6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_failedtocreate6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_failedtocreate6(inputs)
});
export { developerportal_components_createconsentcontractmodal_failedtocreate6 as "developerPortal.components.createConsentContractModal.failedToCreate" }