/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs */

const en_developerportal_guides_embedapp_applistingrequireddesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select an app in Step 1 to create credential templates.`)
};

const es_developerportal_guides_embedapp_applistingrequireddesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona una aplicación en el Paso 1 para crear plantillas de credenciales.`)
};

const fr_developerportal_guides_embedapp_applistingrequireddesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionnez une application à l'étape 1 pour créer des modèles de titres.`)
};

const ar_developerportal_guides_embedapp_applistingrequireddesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر تطبيقًا في الخطوة 1 لإنشاء قوالب الشهادات.`)
};

/**
* | output |
* | --- |
* | "Select an app in Step 1 to create credential templates." |
*
* @param {Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_applistingrequireddesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Applistingrequireddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_applistingrequireddesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_applistingrequireddesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_applistingrequireddesc5(inputs)
	return ar_developerportal_guides_embedapp_applistingrequireddesc5(inputs)
});
export { developerportal_guides_embedapp_applistingrequireddesc5 as "developerPortal.guides.embedApp.appListingRequiredDesc" }