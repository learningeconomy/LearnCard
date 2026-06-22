/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promovideo3Inputs */

const en_appstoreadmin_listing_promovideo3 = /** @type {(inputs: Appstoreadmin_Listing_Promovideo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promo Video`)
};

const es_appstoreadmin_listing_promovideo3 = /** @type {(inputs: Appstoreadmin_Listing_Promovideo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Video Promocional`)
};

const fr_appstoreadmin_listing_promovideo3 = /** @type {(inputs: Appstoreadmin_Listing_Promovideo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vidéo Promo`)
};

const ar_appstoreadmin_listing_promovideo3 = /** @type {(inputs: Appstoreadmin_Listing_Promovideo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فيديو ترويجي`)
};

/**
* | output |
* | --- |
* | "Promo Video" |
*
* @param {Appstoreadmin_Listing_Promovideo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promovideo3 = /** @type {((inputs?: Appstoreadmin_Listing_Promovideo3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promovideo3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promovideo3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promovideo3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promovideo3(inputs)
	return ar_appstoreadmin_listing_promovideo3(inputs)
});
export { appstoreadmin_listing_promovideo3 as "appStoreAdmin.listing.promoVideo" }