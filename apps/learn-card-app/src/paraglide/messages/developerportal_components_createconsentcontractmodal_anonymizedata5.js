/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs */

const en_developerportal_components_createconsentcontractmodal_anonymizedata5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymize Data`)
};

const es_developerportal_components_createconsentcontractmodal_anonymizedata5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymize Data`)
};

const fr_developerportal_components_createconsentcontractmodal_anonymizedata5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymize Data`)
};

const ar_developerportal_components_createconsentcontractmodal_anonymizedata5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anonymize Data`)
};

/**
* | output |
* | --- |
* | "Anonymize Data" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_anonymizedata5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Anonymizedata5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_anonymizedata5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_anonymizedata5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_anonymizedata5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_anonymizedata5(inputs)
});
export { developerportal_components_createconsentcontractmodal_anonymizedata5 as "developerPortal.components.createConsentContractModal.anonymizeData" }