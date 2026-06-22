/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs */

const en_developerportal_components_apppreviewmodal_pleasewait4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please wait`)
};

const es_developerportal_components_apppreviewmodal_pleasewait4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor espera`)
};

const fr_developerportal_components_apppreviewmodal_pleasewait4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez patienter`)
};

const ar_developerportal_components_apppreviewmodal_pleasewait4 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى الانتظار`)
};

/**
* | output |
* | --- |
* | "Please wait" |
*
* @param {Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_pleasewait4 = /** @type {((inputs?: Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Pleasewait4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_pleasewait4(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_pleasewait4(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_pleasewait4(inputs)
	return ar_developerportal_components_apppreviewmodal_pleasewait4(inputs)
});
export { developerportal_components_apppreviewmodal_pleasewait4 as "developerPortal.components.appPreviewModal.pleaseWait" }