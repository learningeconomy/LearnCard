/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs */

const en_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which personal data fields do you want to request from users?`)
};

const es_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which personal data fields do you want to request from users?`)
};

const fr_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which personal data fields do you want to request from users?`)
};

const ar_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Which personal data fields do you want to request from users?`)
};

/**
* | output |
* | --- |
* | "Which personal data fields do you want to request from users?" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Personaldatafieldsdesc7Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7(inputs)
	return ar_developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7(inputs)
});
export { developerportal_components_createconsentcontractmodal_personaldatafieldsdesc7 as "developerPortal.components.createConsentContractModal.personalDataFieldsDesc" }