/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs */

const en_developerportal_components_createconsentcontractmodal_readaccess5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Access`)
};

const es_developerportal_components_createconsentcontractmodal_readaccess5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de Lectura`)
};

const fr_developerportal_components_createconsentcontractmodal_readaccess5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en Lecture`)
};

const ar_developerportal_components_createconsentcontractmodal_readaccess5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول للقراءة`)
};

/**
* | output |
* | --- |
* | "Read Access" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_readaccess5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Readaccess5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_readaccess5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_readaccess5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_readaccess5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_readaccess5(inputs)
});
export { developerportal_components_createconsentcontractmodal_readaccess5 as "developerPortal.components.createConsentContractModal.readAccess" }