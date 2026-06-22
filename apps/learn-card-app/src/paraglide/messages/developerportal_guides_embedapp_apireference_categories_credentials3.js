/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs */

const en_developerportal_guides_embedapp_apireference_categories_credentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

const es_developerportal_guides_embedapp_apireference_categories_credentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

const fr_developerportal_guides_embedapp_apireference_categories_credentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

const ar_developerportal_guides_embedapp_apireference_categories_credentials3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

/**
* | output |
* | --- |
* | "Credentials" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_categories_credentials3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Categories_Credentials3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_categories_credentials3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_categories_credentials3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_categories_credentials3(inputs)
	return ar_developerportal_guides_embedapp_apireference_categories_credentials3(inputs)
});
export { developerportal_guides_embedapp_apireference_categories_credentials3 as "developerPortal.guides.embedApp.apiReference.categories.credentials" }