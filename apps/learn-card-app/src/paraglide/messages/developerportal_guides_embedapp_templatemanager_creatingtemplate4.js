/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs */

const en_developerportal_guides_embedapp_templatemanager_creatingtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating template...`)
};

const es_developerportal_guides_embedapp_templatemanager_creatingtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando plantilla...`)
};

const fr_developerportal_guides_embedapp_templatemanager_creatingtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création du modèle...`)
};

const ar_developerportal_guides_embedapp_templatemanager_creatingtemplate4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creating template...`)
};

/**
* | output |
* | --- |
* | "Creating template..." |
*
* @param {Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_templatemanager_creatingtemplate4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Templatemanager_Creatingtemplate4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_templatemanager_creatingtemplate4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_templatemanager_creatingtemplate4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_templatemanager_creatingtemplate4(inputs)
	return ar_developerportal_guides_embedapp_templatemanager_creatingtemplate4(inputs)
});
export { developerportal_guides_embedapp_templatemanager_creatingtemplate4 as "developerPortal.guides.embedApp.templateManager.creatingTemplate" }