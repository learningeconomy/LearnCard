/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_createyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your App`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_createyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Tu Aplicación`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_createyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Votre Application`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_createyourapp6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تطبيقك`)
};

/**
* | output |
* | --- |
* | "Create Your App" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_createyourapp6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Createyourapp6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_createyourapp6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_createyourapp6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_createyourapp6(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_createyourapp6(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_createyourapp6 as "developerPortal.guides.embedApp.setupWebsiteStep.createYourApp" }