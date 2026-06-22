/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs */

const en_developerportal_components_createconsentcontractmodal_guardianconsentflow6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardian Consent Flow`)
};

const es_developerportal_components_createconsentcontractmodal_guardianconsentflow6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de Consentimiento del Tutor`)
};

const fr_developerportal_components_createconsentcontractmodal_guardianconsentflow6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux de Consentement du Tuteur`)
};

const ar_developerportal_components_createconsentcontractmodal_guardianconsentflow6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق موافقة ولي الأمر`)
};

/**
* | output |
* | --- |
* | "Guardian Consent Flow" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_guardianconsentflow6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Guardianconsentflow6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_guardianconsentflow6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_guardianconsentflow6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_guardianconsentflow6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_guardianconsentflow6(inputs)
});
export { developerportal_components_createconsentcontractmodal_guardianconsentflow6 as "developerPortal.components.createConsentContractModal.guardianConsentFlow" }