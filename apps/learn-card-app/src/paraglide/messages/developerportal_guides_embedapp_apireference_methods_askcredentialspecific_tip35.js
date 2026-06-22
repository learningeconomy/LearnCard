/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs */

const en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Returns null if credential doesn't exist in user's wallet`)
};

const es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Devuelve null if credential doesn't exist in user's wallet`)
};

const fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retourne null if credential doesn't exist in user's wallet`)
};

const ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإرجاع null if credential doesn't exist in user's wallet`)
};

/**
* | output |
* | --- |
* | "Returns null if credential doesn't exist in user's wallet" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip35 as "developerPortal.guides.embedApp.apiReference.methods.askCredentialSpecific.tip3" }