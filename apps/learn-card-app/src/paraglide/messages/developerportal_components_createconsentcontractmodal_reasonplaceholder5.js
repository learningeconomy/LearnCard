/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs */

const en_developerportal_components_createconsentcontractmodal_reasonplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., To verify your credentials`)
};

const es_developerportal_components_createconsentcontractmodal_reasonplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Para verificar tus credenciales`)
};

const fr_developerportal_components_createconsentcontractmodal_reasonplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Pour vérifier vos credentials`)
};

const ar_developerportal_components_createconsentcontractmodal_reasonplaceholder5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: للتحقق من بيانات اعتمادك`)
};

/**
* | output |
* | --- |
* | "e.g., To verify your credentials" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_reasonplaceholder5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Reasonplaceholder5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_reasonplaceholder5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_reasonplaceholder5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_reasonplaceholder5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_reasonplaceholder5(inputs)
});
export { developerportal_components_createconsentcontractmodal_reasonplaceholder5 as "developerPortal.components.createConsentContractModal.reasonPlaceholder" }