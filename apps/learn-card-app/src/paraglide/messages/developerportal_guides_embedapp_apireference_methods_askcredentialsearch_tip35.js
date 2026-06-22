/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs */

const en_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials are cryptographically verifiable`)
};

const es_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials are cryptographically verifiable`)
};

const fr_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials are cryptographically verifiable`)
};

const ar_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials are cryptographically verifiable`)
};

/**
* | output |
* | --- |
* | "Credentials are cryptographically verifiable" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Askcredentialsearch_Tip35Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_askcredentialsearch_tip35 as "developerPortal.guides.embedApp.apiReference.methods.askCredentialSearch.tip3" }