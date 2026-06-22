/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs */

const en_developerportal_components_apppreviewmodal_previewnotavailable5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Not Available`)
};

const es_developerportal_components_apppreviewmodal_previewnotavailable5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa No Disponible`)
};

const fr_developerportal_components_apppreviewmodal_previewnotavailable5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu Non Disponible`)
};

const ar_developerportal_components_apppreviewmodal_previewnotavailable5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعاينة غير متاحة`)
};

/**
* | output |
* | --- |
* | "Preview Not Available" |
*
* @param {Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_previewnotavailable5 = /** @type {((inputs?: Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Previewnotavailable5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_previewnotavailable5(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_previewnotavailable5(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_previewnotavailable5(inputs)
	return ar_developerportal_components_apppreviewmodal_previewnotavailable5(inputs)
});
export { developerportal_components_apppreviewmodal_previewnotavailable5 as "developerPortal.components.appPreviewModal.previewNotAvailable" }