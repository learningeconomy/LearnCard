/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs */

const en_developerportal_guides_embedapp_gettingstarted_createnewapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create New App`)
};

const es_developerportal_guides_embedapp_gettingstarted_createnewapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Nueva Aplicación`)
};

const fr_developerportal_guides_embedapp_gettingstarted_createnewapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Nouvelle Application`)
};

const ar_developerportal_guides_embedapp_gettingstarted_createnewapp5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء تطبيق جديد`)
};

/**
* | output |
* | --- |
* | "Create New App" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_createnewapp5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Createnewapp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_createnewapp5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_createnewapp5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_createnewapp5(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_createnewapp5(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_createnewapp5 as "developerPortal.guides.embedApp.gettingStarted.createNewApp" }