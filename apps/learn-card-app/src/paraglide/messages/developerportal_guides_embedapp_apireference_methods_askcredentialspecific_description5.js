/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs */

const en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential by its ID.`)
};

const es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential by its ID.`)
};

const fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential by its ID.`)
};

const ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request a specific credential by its ID.`)
};

/**
* | output |
* | --- |
* | "Request a specific credential by its ID." |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Description5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_askcredentialspecific_description5 as "developerPortal.guides.embedApp.apiReference.methods.askCredentialSpecific.description" }