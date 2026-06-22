/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs */

const en_developerportal_components_createconsentcontractmodal_subtitle4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtitle (optional)`)
};

const es_developerportal_components_createconsentcontractmodal_subtitle4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subtítulo (opcional)`)
};

const fr_developerportal_components_createconsentcontractmodal_subtitle4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sous-titre (optionnel)`)
};

const ar_developerportal_components_createconsentcontractmodal_subtitle4 = /** @type {(inputs: Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان فرعي (اختياري)`)
};

/**
* | output |
* | --- |
* | "Subtitle (optional)" |
*
* @param {Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_createconsentcontractmodal_subtitle4 = /** @type {((inputs?: Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Createconsentcontractmodal_Subtitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_createconsentcontractmodal_subtitle4(inputs)
	if (locale === "es") return es_developerportal_components_createconsentcontractmodal_subtitle4(inputs)
	if (locale === "fr") return fr_developerportal_components_createconsentcontractmodal_subtitle4(inputs)
	return ar_developerportal_components_createconsentcontractmodal_subtitle4(inputs)
});
export { developerportal_components_createconsentcontractmodal_subtitle4 as "developerPortal.components.createConsentContractModal.subtitle" }