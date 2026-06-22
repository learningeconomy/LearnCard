/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Nativeapplinks4Inputs */

const en_appstoreadmin_listing_nativeapplinks4 = /** @type {(inputs: Appstoreadmin_Listing_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Native App Links`)
};

const es_appstoreadmin_listing_nativeapplinks4 = /** @type {(inputs: Appstoreadmin_Listing_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlaces de Apps Nativas`)
};

const fr_appstoreadmin_listing_nativeapplinks4 = /** @type {(inputs: Appstoreadmin_Listing_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens d'Apps Natives`)
};

const ar_appstoreadmin_listing_nativeapplinks4 = /** @type {(inputs: Appstoreadmin_Listing_Nativeapplinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط التطبيقات الأصلية`)
};

/**
* | output |
* | --- |
* | "Native App Links" |
*
* @param {Appstoreadmin_Listing_Nativeapplinks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_nativeapplinks4 = /** @type {((inputs?: Appstoreadmin_Listing_Nativeapplinks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Nativeapplinks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_nativeapplinks4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_nativeapplinks4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_nativeapplinks4(inputs)
	return ar_appstoreadmin_listing_nativeapplinks4(inputs)
});
export { appstoreadmin_listing_nativeapplinks4 as "appStoreAdmin.listing.nativeAppLinks" }