/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs */

const en_developerportal_guides_embedapp_yourapp_embedurlrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your embed URL before continuing`)
};

const es_developerportal_guides_embedapp_yourapp_embedurlrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your embed URL before continuing`)
};

const fr_developerportal_guides_embedapp_yourapp_embedurlrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your embed URL before continuing`)
};

const ar_developerportal_guides_embedapp_yourapp_embedurlrequired5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter your embed URL before continuing`)
};

/**
* | output |
* | --- |
* | "Please enter your embed URL before continuing" |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_embedurlrequired5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Embedurlrequired5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_embedurlrequired5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_embedurlrequired5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_embedurlrequired5(inputs)
	return ar_developerportal_guides_embedapp_yourapp_embedurlrequired5(inputs)
});
export { developerportal_guides_embedapp_yourapp_embedurlrequired5 as "developerPortal.guides.embedApp.yourApp.embedUrlRequired" }