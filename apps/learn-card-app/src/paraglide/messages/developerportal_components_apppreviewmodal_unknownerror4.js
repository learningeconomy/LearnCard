/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs */

const en_developerportal_components_apppreviewmodal_unknownerror4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown error`)
};

const es_developerportal_components_apppreviewmodal_unknownerror4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Unknown error]`)
};

const fr_developerportal_components_apppreviewmodal_unknownerror4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Unknown error]`)
};

const ar_developerportal_components_apppreviewmodal_unknownerror4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Unknown error]`)
};

/**
* | output |
* | --- |
* | "Unknown error" |
*
* @param {Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_unknownerror4 = /** @type {((inputs?: Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Unknownerror4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_unknownerror4(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_unknownerror4(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_unknownerror4(inputs)
	return ar_developerportal_components_apppreviewmodal_unknownerror4(inputs)
});
export { developerportal_components_apppreviewmodal_unknownerror4 as "developerPortal.components.appPreviewModal.unknownError" }