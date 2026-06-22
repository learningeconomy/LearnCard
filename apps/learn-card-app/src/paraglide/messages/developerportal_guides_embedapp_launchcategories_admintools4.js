/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs */

const en_developerportal_guides_embedapp_launchcategories_admintools4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admin Tools`)
};

const es_developerportal_guides_embedapp_launchcategories_admintools4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramientas de Administración`)
};

const fr_developerportal_guides_embedapp_launchcategories_admintools4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outils Admin`)
};

const ar_developerportal_guides_embedapp_launchcategories_admintools4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدوات الإدارة`)
};

/**
* | output |
* | --- |
* | "Admin Tools" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_admintools4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Admintools4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_admintools4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_admintools4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_admintools4(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_admintools4(inputs)
});
export { developerportal_guides_embedapp_launchcategories_admintools4 as "developerPortal.guides.embedApp.launchCategories.adminTools" }