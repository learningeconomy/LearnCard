/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs */

const en_developerportal_components_createconsentcontractmodal_readaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want to request access to read from users?`)
};

const es_developerportal_components_createconsentcontractmodal_readaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want to request access to read from users?`)
};

const fr_developerportal_components_createconsentcontractmodal_readaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want to request access to read from users?`)
};

const ar_developerportal_components_createconsentcontractmodal_readaccessdesc6 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What credential categories do you want to request access to read from users?`)
};

/**
* | output |
* | --- |
* | "What credential categories do you want to request access to read from users?" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_readaccessdesc6 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Readaccessdesc6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_readaccessdesc6(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_readaccessdesc6(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_readaccessdesc6(inputs)
	return ar_developerportal_components_createconsentcontractmodal_readaccessdesc6(inputs)
});
export { developerportal_components_createconsentcontractmodal_readaccessdesc6 as "developerPortal.components.createConsentContractModal.readAccessDesc" }