/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs */

const en_developerportal_guides_embedapp_choosefeatures_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the features you want to add to your app. You can always add more later.`)
};

const es_developerportal_guides_embedapp_choosefeatures_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona las funciones que quieres añadir a tu aplicación. Siempre puedes añadir más después.`)
};

const fr_developerportal_guides_embedapp_choosefeatures_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the features you want to add to your app. You can always add more later.`)
};

const ar_developerportal_guides_embedapp_choosefeatures_description3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select the features you want to add to your app. You can always add more later.`)
};

/**
* | output |
* | --- |
* | "Select the features you want to add to your app. You can always add more later." |
*
* @param {Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_choosefeatures_description3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Choosefeatures_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_choosefeatures_description3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_choosefeatures_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_choosefeatures_description3(inputs)
	return ar_developerportal_guides_embedapp_choosefeatures_description3(inputs)
});
export { developerportal_guides_embedapp_choosefeatures_description3 as "developerPortal.guides.embedApp.chooseFeatures.description" }