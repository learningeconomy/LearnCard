/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs */

const en_developerportal_components_createconsentcontractmodal_writeaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want permission to send to users?`)
};

const es_developerportal_components_createconsentcontractmodal_writeaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want permission to send to users?`)
};

const fr_developerportal_components_createconsentcontractmodal_writeaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want permission to send to users?`)
};

const ar_developerportal_components_createconsentcontractmodal_writeaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want permission to send to users?`)
};

/**
* | output |
* | --- |
* | "What credential categories do you want permission to send to users?" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_writeaccessdesc6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Writeaccessdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_writeaccessdesc6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_writeaccessdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_writeaccessdesc6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_writeaccessdesc6(inputs)
});
export { developerportal_components_createconsentcontractmodal_writeaccessdesc6 as "developerPortal.components.createConsentContractModal.writeAccessDesc" }