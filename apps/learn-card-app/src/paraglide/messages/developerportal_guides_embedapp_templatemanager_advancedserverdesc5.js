/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs */

const en_developerportal_guides_embedapp_templatemanager_advancedserverdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve templates programmatically from your backend`)
};

const es_developerportal_guides_embedapp_templatemanager_advancedserverdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve templates programmatically from your backend`)
};

const fr_developerportal_guides_embedapp_templatemanager_advancedserverdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve templates programmatically from your backend`)
};

const ar_developerportal_guides_embedapp_templatemanager_advancedserverdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retrieve templates programmatically from your backend`)
};

/**
* | output |
* | --- |
* | "Retrieve templates programmatically from your backend" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_advancedserverdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Advancedserverdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_advancedserverdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_advancedserverdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_advancedserverdesc5(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_advancedserverdesc5(inputs)
});
export { developerportal_guides_embedapp_templatemanager_advancedserverdesc5 as "developerPortal.guides.embedApp.templateManager.advancedServerDesc" }