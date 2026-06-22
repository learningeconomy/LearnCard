/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs */

const en_developerportal_components_createconsentcontractmodal_redirecturl5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirect URL`)
};

const es_developerportal_components_createconsentcontractmodal_redirecturl5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Redirección`)
};

const fr_developerportal_components_createconsentcontractmodal_redirecturl5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Redirection`)
};

const ar_developerportal_components_createconsentcontractmodal_redirecturl5 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط إعادة التوجيه`)
};

/**
* | output |
* | --- |
* | "Redirect URL" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_redirecturl5 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Redirecturl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_redirecturl5(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_redirecturl5(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_redirecturl5(inputs)
	return ar_developerportal_components_createconsentcontractmodal_redirecturl5(inputs)
});
export { developerportal_components_createconsentcontractmodal_redirecturl5 as "developerPortal.components.createConsentContractModal.redirectUrl" }