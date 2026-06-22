/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs */

const en_developerportal_guides_embedapp_templatemanager_createtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Template`)
};

const es_developerportal_guides_embedapp_templatemanager_createtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Plantilla`)
};

const fr_developerportal_guides_embedapp_templatemanager_createtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un Modèle`)
};

const ar_developerportal_guides_embedapp_templatemanager_createtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء قالب`)
};

/**
* | output |
* | --- |
* | "Create Template" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_createtemplate4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Createtemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_createtemplate4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_createtemplate4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_createtemplate4(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_createtemplate4(inputs)
});
export { developerportal_guides_embedapp_templatemanager_createtemplate4 as "developerPortal.guides.embedApp.templateManager.createTemplate" }