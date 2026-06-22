/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs */

const en_developerportal_guides_embedapp_yourapp_appconfiguration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Configuration`)
};

const es_developerportal_guides_embedapp_yourapp_appconfiguration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración de la Aplicación`)
};

const fr_developerportal_guides_embedapp_yourapp_appconfiguration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration de l'App`)
};

const ar_developerportal_guides_embedapp_yourapp_appconfiguration4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين التطبيق`)
};

/**
* | output |
* | --- |
* | "App Configuration" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_appconfiguration4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Appconfiguration4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_appconfiguration4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_appconfiguration4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_appconfiguration4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_appconfiguration4(inputs)
});
export { developerportal_guides_embedapp_yourapp_appconfiguration4 as "developerPortal.guides.embedApp.yourApp.appConfiguration" }