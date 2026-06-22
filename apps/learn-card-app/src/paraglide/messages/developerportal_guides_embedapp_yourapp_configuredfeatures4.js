/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs */

const en_developerportal_guides_embedapp_yourapp_configuredfeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configured Features`)
};

const es_developerportal_guides_embedapp_yourapp_configuredfeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Funciones Configuradas`)
};

const fr_developerportal_guides_embedapp_yourapp_configuredfeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctionnalités Configurées`)
};

const ar_developerportal_guides_embedapp_yourapp_configuredfeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الميزات التي تم تكوينها`)
};

/**
* | output |
* | --- |
* | "Configured Features" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_configuredfeatures4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Configuredfeatures4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_configuredfeatures4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_configuredfeatures4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_configuredfeatures4(inputs)
	return ar_developerportal_guides_embedapp_yourapp_configuredfeatures4(inputs)
});
export { developerportal_guides_embedapp_yourapp_configuredfeatures4 as "developerPortal.guides.embedApp.yourApp.configuredFeatures" }