/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Appstoreadmin_Listing_Screenshots2Inputs */

const en_appstoreadmin_listing_screenshots2 = /** @type {(inputs: Appstoreadmin_Listing_Screenshots2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Screenshots (${i?.count})`)
};

const es_appstoreadmin_listing_screenshots2 = /** @type {(inputs: Appstoreadmin_Listing_Screenshots2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Capturas (${i?.count})`)
};

const fr_appstoreadmin_listing_screenshots2 = /** @type {(inputs: Appstoreadmin_Listing_Screenshots2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Captures d'écran (${i?.count})`)
};

const ar_appstoreadmin_listing_screenshots2 = /** @type {(inputs: Appstoreadmin_Listing_Screenshots2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لقطات الشاشة (${i?.count})`)
};

/**
* | output |
* | --- |
* | "Screenshots ({count})" |
*
* @param {Appstoreadmin_Listing_Screenshots2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_screenshots2 = /** @type {((inputs: Appstoreadmin_Listing_Screenshots2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Screenshots2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_screenshots2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_screenshots2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_screenshots2(inputs)
	return ar_appstoreadmin_listing_screenshots2(inputs)
});
export { appstoreadmin_listing_screenshots2 as "appStoreAdmin.listing.screenshots" }