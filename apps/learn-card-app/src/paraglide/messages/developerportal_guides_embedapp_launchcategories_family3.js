/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs */

const en_developerportal_guides_embedapp_launchcategories_family3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Family`)
};

const es_developerportal_guides_embedapp_launchcategories_family3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Familia`)
};

const fr_developerportal_guides_embedapp_launchcategories_family3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Famille`)
};

const ar_developerportal_guides_embedapp_launchcategories_family3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العائلة`)
};

/**
* | output |
* | --- |
* | "Family" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_family3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Family3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_family3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_family3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_family3(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_family3(inputs)
});
export { developerportal_guides_embedapp_launchcategories_family3 as "developerPortal.guides.embedApp.launchCategories.family" }