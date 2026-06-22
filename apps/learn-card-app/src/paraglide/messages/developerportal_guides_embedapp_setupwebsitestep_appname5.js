/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs */

const en_developerportal_guides_embedapp_setupwebsitestep_appname5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Name (for reference)`)
};

const es_developerportal_guides_embedapp_setupwebsitestep_appname5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de la Aplicación (for reference)`)
};

const fr_developerportal_guides_embedapp_setupwebsitestep_appname5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom de l'Application (for reference)`)
};

const ar_developerportal_guides_embedapp_setupwebsitestep_appname5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم التطبيق (for reference)`)
};

/**
* | output |
* | --- |
* | "App Name (for reference)" |
*
* @param {Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_setupwebsitestep_appname5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Setupwebsitestep_Appname5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_setupwebsitestep_appname5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_setupwebsitestep_appname5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_setupwebsitestep_appname5(inputs)
	return ar_developerportal_guides_embedapp_setupwebsitestep_appname5(inputs)
});
export { developerportal_guides_embedapp_setupwebsitestep_appname5 as "developerPortal.guides.embedApp.setupWebsiteStep.appName" }