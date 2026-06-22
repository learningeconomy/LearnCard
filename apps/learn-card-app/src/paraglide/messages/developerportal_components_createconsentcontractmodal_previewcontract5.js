/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs */

const en_developerportal_components_createconsentcontractmodal_previewcontract5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Contract`)
};

const es_developerportal_components_createconsentcontractmodal_previewcontract5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa del Contrato`)
};

const fr_developerportal_components_createconsentcontractmodal_previewcontract5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du Contrat`)
};

const ar_developerportal_components_createconsentcontractmodal_previewcontract5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة العقد`)
};

/**
* | output |
* | --- |
* | "Preview Contract" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_previewcontract5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Previewcontract5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_previewcontract5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_previewcontract5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_previewcontract5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_previewcontract5(inputs)
});
export { developerportal_components_createconsentcontractmodal_previewcontract5 as "developerPortal.components.createConsentContractModal.previewContract" }