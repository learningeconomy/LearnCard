/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs */

const en_developerportal_guides_embedapp_launchcategories_corenav4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Core Navigation`)
};

const es_developerportal_guides_embedapp_launchcategories_corenav4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navegación Principal`)
};

const fr_developerportal_guides_embedapp_launchcategories_corenav4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigation Principale`)
};

const ar_developerportal_guides_embedapp_launchcategories_corenav4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Core التنقل`)
};

/**
* | output |
* | --- |
* | "Core Navigation" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_corenav4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Corenav4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_corenav4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_corenav4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_corenav4(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_corenav4(inputs)
});
export { developerportal_guides_embedapp_launchcategories_corenav4 as "developerPortal.guides.embedApp.launchCategories.coreNav" }