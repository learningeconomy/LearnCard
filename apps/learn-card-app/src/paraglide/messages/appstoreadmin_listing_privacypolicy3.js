/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Privacypolicy3Inputs */

const en_appstoreadmin_listing_privacypolicy3 = /** @type {(inputs: Appstoreadmin_Listing_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_appstoreadmin_listing_privacypolicy3 = /** @type {(inputs: Appstoreadmin_Listing_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de Privacidad`)
};

const fr_appstoreadmin_listing_privacypolicy3 = /** @type {(inputs: Appstoreadmin_Listing_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de Confidentialité`)
};

const ar_appstoreadmin_listing_privacypolicy3 = /** @type {(inputs: Appstoreadmin_Listing_Privacypolicy3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Appstoreadmin_Listing_Privacypolicy3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_privacypolicy3 = /** @type {((inputs?: Appstoreadmin_Listing_Privacypolicy3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Privacypolicy3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_privacypolicy3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_privacypolicy3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_privacypolicy3(inputs)
	return ar_appstoreadmin_listing_privacypolicy3(inputs)
});
export { appstoreadmin_listing_privacypolicy3 as "appStoreAdmin.listing.privacyPolicy" }