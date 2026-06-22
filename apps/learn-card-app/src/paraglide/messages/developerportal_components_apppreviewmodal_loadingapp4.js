/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs */

const en_developerportal_components_apppreviewmodal_loadingapp4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Loading ${i?.name}...`)
};

const es_developerportal_components_apppreviewmodal_loadingapp4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Loading ${i?.name}...`)
};

const fr_developerportal_components_apppreviewmodal_loadingapp4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Loading ${i?.name}...`)
};

const ar_developerportal_components_apppreviewmodal_loadingapp4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Loading ${i?.name}...`)
};

/**
* | output |
* | --- |
* | "Loading {name}..." |
*
* @param {Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_loadingapp4 = /** @type {((inputs: Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Loadingapp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_loadingapp4(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_loadingapp4(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_loadingapp4(inputs)
	return ar_developerportal_components_apppreviewmodal_loadingapp4(inputs)
});
export { developerportal_components_apppreviewmodal_loadingapp4 as "developerPortal.components.appPreviewModal.loadingApp" }