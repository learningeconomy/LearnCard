/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ id: NonNullable<unknown> }} Appstoreadmin_Listing_Googleplaystore4Inputs */

const en_appstoreadmin_listing_googleplaystore4 = /** @type {(inputs: Appstoreadmin_Listing_Googleplaystore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Google Play Store (${i?.id})`)
};

const es_appstoreadmin_listing_googleplaystore4 = /** @type {(inputs: Appstoreadmin_Listing_Googleplaystore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Google Play Store (${i?.id})`)
};

const fr_appstoreadmin_listing_googleplaystore4 = /** @type {(inputs: Appstoreadmin_Listing_Googleplaystore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Google Play Store (${i?.id})`)
};

const ar_appstoreadmin_listing_googleplaystore4 = /** @type {(inputs: Appstoreadmin_Listing_Googleplaystore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Google Play Store (${i?.id})`)
};

/**
* | output |
* | --- |
* | "Google Play Store ({id})" |
*
* @param {Appstoreadmin_Listing_Googleplaystore4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_googleplaystore4 = /** @type {((inputs: Appstoreadmin_Listing_Googleplaystore4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Googleplaystore4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_googleplaystore4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_googleplaystore4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_googleplaystore4(inputs)
	return ar_appstoreadmin_listing_googleplaystore4(inputs)
});
export { appstoreadmin_listing_googleplaystore4 as "appStoreAdmin.listing.googlePlayStore" }