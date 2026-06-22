/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs */

const en_developerportal_components_createconsentcontractmodal_anonymizedatadesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request data without identifying information`)
};

const es_developerportal_components_createconsentcontractmodal_anonymizedatadesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request data without identifying information`)
};

const fr_developerportal_components_createconsentcontractmodal_anonymizedatadesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request data without identifying information`)
};

const ar_developerportal_components_createconsentcontractmodal_anonymizedatadesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request data without identifying information`)
};

/**
* | output |
* | --- |
* | "Request data without identifying information" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_anonymizedatadesc6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Anonymizedatadesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_anonymizedatadesc6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_anonymizedatadesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_anonymizedatadesc6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_anonymizedatadesc6(inputs)
});
export { developerportal_components_createconsentcontractmodal_anonymizedatadesc6 as "developerPortal.components.createConsentContractModal.anonymizeDataDesc" }