/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs */

const en_developerportal_guides_embedapp_templatemanager_applistingrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Listing Required`)
};

const es_developerportal_guides_embedapp_templatemanager_applistingrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere listado de aplicación`)
};

const fr_developerportal_guides_embedapp_templatemanager_applistingrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste d'application requise`)
};

const ar_developerportal_guides_embedapp_templatemanager_applistingrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة التطبيق مطلوبة`)
};

/**
* | output |
* | --- |
* | "App Listing Required" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_applistingrequired5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Applistingrequired5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_applistingrequired5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_applistingrequired5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_applistingrequired5(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_applistingrequired5(inputs)
});
export { developerportal_guides_embedapp_templatemanager_applistingrequired5 as "developerPortal.guides.embedApp.templateManager.appListingRequired" }