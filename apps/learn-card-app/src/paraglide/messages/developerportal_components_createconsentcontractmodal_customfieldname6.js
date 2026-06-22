/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs */

const en_developerportal_components_createconsentcontractmodal_customfieldname6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom field name...`)
};

const es_developerportal_components_createconsentcontractmodal_customfieldname6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de campo personalizado...`)
};

const fr_developerportal_components_createconsentcontractmodal_customfieldname6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom du champ personnalisé...`)
};

const ar_developerportal_components_createconsentcontractmodal_customfieldname6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم حقل مخصص...`)
};

/**
* | output |
* | --- |
* | "Custom field name..." |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_customfieldname6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Customfieldname6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_customfieldname6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_customfieldname6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_customfieldname6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_customfieldname6(inputs)
});
export { developerportal_components_createconsentcontractmodal_customfieldname6 as "developerPortal.components.createConsentContractModal.customFieldName" }