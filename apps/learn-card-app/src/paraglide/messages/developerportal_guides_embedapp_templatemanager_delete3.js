/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs */

const en_developerportal_guides_embedapp_templatemanager_delete3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_developerportal_guides_embedapp_templatemanager_delete3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const fr_developerportal_guides_embedapp_templatemanager_delete3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ar_developerportal_guides_embedapp_templatemanager_delete3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_delete3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Delete3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_delete3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_delete3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_delete3(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_delete3(inputs)
});
export { developerportal_guides_embedapp_templatemanager_delete3 as "developerPortal.guides.embedApp.templateManager.delete" }