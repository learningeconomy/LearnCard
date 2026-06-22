/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs */

const en_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential`)
};

const es_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential`)
};

const fr_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential`)
};

const ar_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue a credential`)
};

/**
* | output |
* | --- |
* | "Issue a credential" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Shortdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_sendcredential_shortdesc5 as "developerPortal.guides.embedApp.apiReference.methods.sendCredential.shortDesc" }