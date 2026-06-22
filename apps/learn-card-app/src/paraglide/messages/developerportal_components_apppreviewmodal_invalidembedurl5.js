/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ url: NonNullable<unknown> }} Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs */

const en_developerportal_components_apppreviewmodal_invalidembedurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalid embed URL: ${i?.url}`)
};

const es_developerportal_components_apppreviewmodal_invalidembedurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalid embed URL: ${i?.url}`)
};

const fr_developerportal_components_apppreviewmodal_invalidembedurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalid embed URL: ${i?.url}`)
};

const ar_developerportal_components_apppreviewmodal_invalidembedurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Invalid embed URL: ${i?.url}`)
};

/**
* | output |
* | --- |
* | "Invalid embed URL: {url}" |
*
* @param {Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_invalidembedurl5 = /** @type {((inputs: Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Invalidembedurl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_invalidembedurl5(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_invalidembedurl5(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_invalidembedurl5(inputs)
	return ar_developerportal_components_apppreviewmodal_invalidembedurl5(inputs)
});
export { developerportal_components_apppreviewmodal_invalidembedurl5 as "developerPortal.components.appPreviewModal.invalidEmbedUrl" }