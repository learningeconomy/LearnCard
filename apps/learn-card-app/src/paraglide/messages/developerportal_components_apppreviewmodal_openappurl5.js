/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Apppreviewmodal_Openappurl5Inputs */

const en_developerportal_components_apppreviewmodal_openappurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Openappurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open App URL`)
};

const es_developerportal_components_apppreviewmodal_openappurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Openappurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir URL de la App`)
};

const fr_developerportal_components_apppreviewmodal_openappurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Openappurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir l'URL de l'App`)
};

const ar_developerportal_components_apppreviewmodal_openappurl5 = /** @type {(inputs: Developerportal_Components_Apppreviewmodal_Openappurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح رابط التطبيق`)
};

/**
* | output |
* | --- |
* | "Open App URL" |
*
* @param {Developerportal_Components_Apppreviewmodal_Openappurl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_apppreviewmodal_openappurl5 = /** @type {((inputs?: Developerportal_Components_Apppreviewmodal_Openappurl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Apppreviewmodal_Openappurl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_apppreviewmodal_openappurl5(inputs)
	if (locale === "es") return es_developerportal_components_apppreviewmodal_openappurl5(inputs)
	if (locale === "fr") return fr_developerportal_components_apppreviewmodal_openappurl5(inputs)
	return ar_developerportal_components_apppreviewmodal_openappurl5(inputs)
});
export { developerportal_components_apppreviewmodal_openappurl5 as "developerPortal.components.appPreviewModal.openAppUrl" }