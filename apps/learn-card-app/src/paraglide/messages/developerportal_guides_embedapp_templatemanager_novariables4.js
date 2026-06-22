/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs */

const en_developerportal_guides_embedapp_templatemanager_novariables4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No variables`)
};

const es_developerportal_guides_embedapp_templatemanager_novariables4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No variables`)
};

const fr_developerportal_guides_embedapp_templatemanager_novariables4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No variables`)
};

const ar_developerportal_guides_embedapp_templatemanager_novariables4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No variables`)
};

/**
* | output |
* | --- |
* | "No variables" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_novariables4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Novariables4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_novariables4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_novariables4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_novariables4(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_novariables4(inputs)
});
export { developerportal_guides_embedapp_templatemanager_novariables4 as "developerPortal.guides.embedApp.templateManager.noVariables" }