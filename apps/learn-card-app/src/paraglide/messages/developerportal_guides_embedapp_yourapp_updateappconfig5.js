/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs */

const en_developerportal_guides_embedapp_yourapp_updateappconfig5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update App Configuration?`)
};

const es_developerportal_guides_embedapp_yourapp_updateappconfig5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar Configuraciónuración de la Aplicación?`)
};

const fr_developerportal_guides_embedapp_yourapp_updateappconfig5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour la configuration de l'App?`)
};

const ar_developerportal_guides_embedapp_yourapp_updateappconfig5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update تكوين التطبيق?`)
};

/**
* | output |
* | --- |
* | "Update App Configuration?" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_updateappconfig5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Updateappconfig5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_updateappconfig5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_updateappconfig5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_updateappconfig5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_updateappconfig5(inputs)
});
export { developerportal_guides_embedapp_yourapp_updateappconfig5 as "developerPortal.guides.embedApp.yourApp.updateAppConfig" }