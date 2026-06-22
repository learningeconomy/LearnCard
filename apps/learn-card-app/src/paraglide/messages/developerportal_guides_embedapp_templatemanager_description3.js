/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs */

const en_developerportal_guides_embedapp_templatemanager_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates that your embedded app can issue to users`)
};

const es_developerportal_guides_embedapp_templatemanager_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear credential templates that your embedded app can issue to users`)
};

const fr_developerportal_guides_embedapp_templatemanager_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create credential templates that your embedded app can issue to users`)
};

const ar_developerportal_guides_embedapp_templatemanager_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء credential templates that your embedded app can issue to users`)
};

/**
* | output |
* | --- |
* | "Create credential templates that your embedded app can issue to users" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_description3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_description3(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_description3(inputs)
});
export { developerportal_guides_embedapp_templatemanager_description3 as "developerPortal.guides.embedApp.templateManager.description" }