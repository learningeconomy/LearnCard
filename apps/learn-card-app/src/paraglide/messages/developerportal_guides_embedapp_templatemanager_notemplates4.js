/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs */

const en_developerportal_guides_embedapp_templatemanager_notemplates4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates yet`)
};

const es_developerportal_guides_embedapp_templatemanager_notemplates4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin plantillas aún`)
};

const fr_developerportal_guides_embedapp_templatemanager_notemplates4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle pour le moment`)
};

const ar_developerportal_guides_embedapp_templatemanager_notemplates4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد قوالب بعد`)
};

/**
* | output |
* | --- |
* | "No templates yet" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_notemplates4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Notemplates4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_notemplates4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_notemplates4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_notemplates4(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_notemplates4(inputs)
});
export { developerportal_guides_embedapp_templatemanager_notemplates4 as "developerPortal.guides.embedApp.templateManager.noTemplates" }