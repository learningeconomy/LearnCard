/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs */

const en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User must still approve sharing the credential`)
};

const es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User must still approve sharing the credential`)
};

const fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User must still approve sharing the credential`)
};

const ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`User must still approve sharing the credential`)
};

/**
* | output |
* | --- |
* | "User must still approve sharing the credential" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialspecific_Tip25Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_askcredentialspecific_tip25 as "developerPortal.guides.embedApp.apiReference.methods.askCredentialSpecific.tip2" }