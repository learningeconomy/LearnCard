/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs */

const en_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include your issuer DID for credential verification`)
};

const es_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include your issuer DID for credential verification`)
};

const fr_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include your issuer DID for credential verification`)
};

const ar_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 = /** @type {(inputs: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Include your issuer DID for credential verification`)
};

/**
* | output |
* | --- |
* | "Include your issuer DID for credential verification" |
*
* @param {Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Apireference_Methods_Sendcredential_Tip24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24(inputs)
	return ar_developerportal_guides_embedapp_apireference_methods_sendcredential_tip24(inputs)
});
export { developerportal_guides_embedapp_apireference_methods_sendcredential_tip24 as "developerPortal.guides.embedApp.apiReference.methods.sendCredential.tip2" }