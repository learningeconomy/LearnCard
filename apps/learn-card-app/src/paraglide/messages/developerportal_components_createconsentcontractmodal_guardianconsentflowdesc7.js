/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs */

const en_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Require guardian approval for minors`)
};

const es_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requiere aprobación del tutor para menores`)
};

const fr_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nécessite l'approbation du tuteur pour les mineurs`)
};

const ar_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتطلب موافقة ولي الأمر للقاصرين`)
};

/**
* | output |
* | --- |
* | "Require guardian approval for minors" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Guardianconsentflowdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7(inputs)
	return ar_developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7(inputs)
});
export { developerportal_components_createconsentcontractmodal_guardianconsentflowdesc7 as "developerPortal.components.createConsentContractModal.guardianConsentFlowDesc" }