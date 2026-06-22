/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs */

const en_developerportal_guides_embedapp_apireference_categories_navigation3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigation`)
};

const es_developerportal_guides_embedapp_apireference_categories_navigation3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navegación`)
};

const fr_developerportal_guides_embedapp_apireference_categories_navigation3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigation`)
};

const ar_developerportal_guides_embedapp_apireference_categories_navigation3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التنقل`)
};

/**
* | output |
* | --- |
* | "Navigation" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_categories_navigation3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Categories_Navigation3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_categories_navigation3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_categories_navigation3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_categories_navigation3(inputs)
	return ar_developerportal_guides_embedapp_apireference_categories_navigation3(inputs)
});
export { developerportal_guides_embedapp_apireference_categories_navigation3 as "developerPortal.guides.embedApp.apiReference.categories.navigation" }