/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs */

const en_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Open Badges 3.0 format for maximum compatibility`)
};

const es_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Open Badges 3.0 format for maximum compatibility`)
};

const fr_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Open Badges 3.0 format for maximum compatibility`)
};

const ar_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use Open Badges 3.0 format for maximum compatibility`)
};

/**
* | output |
* | --- |
* | "Use Open Badges 3.0 format for maximum compatibility" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip14Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_sendcredential_tip14(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_sendcredential_tip14 as "developerPortal.guides.embedApp.apiReference.methods.sendCredential.tip1" }