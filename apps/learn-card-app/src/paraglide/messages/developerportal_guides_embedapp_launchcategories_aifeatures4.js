/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs */

const en_developerportal_guides_embedapp_launchcategories_aifeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Features`)
};

const es_developerportal_guides_embedapp_launchcategories_aifeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Funciones de IA`)
};

const fr_developerportal_guides_embedapp_launchcategories_aifeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fonctionnalités IA`)
};

const ar_developerportal_guides_embedapp_launchcategories_aifeatures4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ميزات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Features" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_aifeatures4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Aifeatures4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_aifeatures4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_aifeatures4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_aifeatures4(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_aifeatures4(inputs)
});
export { developerportal_guides_embedapp_launchcategories_aifeatures4 as "developerPortal.guides.embedApp.launchCategories.aiFeatures" }