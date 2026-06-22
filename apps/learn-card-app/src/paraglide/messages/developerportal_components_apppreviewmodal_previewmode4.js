/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Apppreviewmodal_Previewmode4Inputs */

const en_developerportal_components_apppreviewmodal_previewmode4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Mode`)
};

const es_developerportal_components_apppreviewmodal_previewmode4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo de Vista Previa`)
};

const fr_developerportal_components_apppreviewmodal_previewmode4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode Aperçu`)
};

const ar_developerportal_components_apppreviewmodal_previewmode4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewmode4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وضع المعاينة`)
};

/**
* | output |
* | --- |
* | "Preview Mode" |
*
* @param {Developerportal_Components_Apppreviewmodal_Previewmode4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_previewmode4 = /** @type {((inputs?: Developerportal_Components_Apppreviewmodal_Previewmode4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Previewmode4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_previewmode4(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_previewmode4(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_previewmode4(inputs)
	return ar_developerportal_components_apppreviewmodal_previewmode4(inputs)
});
export { developerportal_components_apppreviewmodal_previewmode4 as "developerPortal.components.appPreviewModal.previewMode" }