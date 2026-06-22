/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs */

const en_developerportal_components_createconsentcontractmodal_createconsentcontract6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Consent Contract`)
};

const es_developerportal_components_createconsentcontractmodal_createconsentcontract6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Contrato de Consentimiento`)
};

const fr_developerportal_components_createconsentcontractmodal_createconsentcontract6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Contrat de Consentement`)
};

const ar_developerportal_components_createconsentcontractmodal_createconsentcontract6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عقد موافقة`)
};

/**
* | output |
* | --- |
* | "Create Consent Contract" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_createconsentcontract6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Createconsentcontract6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_createconsentcontract6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_createconsentcontract6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_createconsentcontract6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_createconsentcontract6(inputs)
});
export { developerportal_components_createconsentcontractmodal_createconsentcontract6 as "developerPortal.components.createConsentContractModal.createConsentContract" }