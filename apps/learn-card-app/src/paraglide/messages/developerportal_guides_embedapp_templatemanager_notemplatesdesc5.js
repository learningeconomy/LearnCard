/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs */

const en_developerportal_guides_embedapp_templatemanager_notemplatesdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your first boost template to start issuing credentials from your app`)
};

const es_developerportal_guides_embedapp_templatemanager_notemplatesdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear your first boost template to start issuing credentials from your app`)
};

const fr_developerportal_guides_embedapp_templatemanager_notemplatesdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your first boost template to start issuing credentials from your app`)
};

const ar_developerportal_guides_embedapp_templatemanager_notemplatesdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء your first boost template to start issuing credentials from your app`)
};

/**
* | output |
* | --- |
* | "Create your first boost template to start issuing credentials from your app" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_notemplatesdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Notemplatesdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_notemplatesdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_notemplatesdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_notemplatesdesc5(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_notemplatesdesc5(inputs)
});
export { developerportal_guides_embedapp_templatemanager_notemplatesdesc5 as "developerPortal.guides.embedApp.templateManager.noTemplatesDesc" }