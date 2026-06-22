/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ id: NonNullable<unknown> }} Appstoreadmin_Listing_Iosappstore4Inputs */

const en_appstoreadmin_listing_iosappstore4 = /** @type {(inputs: Appstoreadmin_Listing_Iosappstore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`iOS App Store (${i?.id})`)
};

const es_appstoreadmin_listing_iosappstore4 = /** @type {(inputs: Appstoreadmin_Listing_Iosappstore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`iOS App Store (${i?.id})`)
};

const fr_appstoreadmin_listing_iosappstore4 = /** @type {(inputs: Appstoreadmin_Listing_Iosappstore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`iOS App Store (${i?.id})`)
};

const ar_appstoreadmin_listing_iosappstore4 = /** @type {(inputs: Appstoreadmin_Listing_Iosappstore4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`iOS App Store (${i?.id})`)
};

/**
* | output |
* | --- |
* | "iOS App Store ({id})" |
*
* @param {Appstoreadmin_Listing_Iosappstore4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_iosappstore4 = /** @type {((inputs: Appstoreadmin_Listing_Iosappstore4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Iosappstore4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_iosappstore4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_iosappstore4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_iosappstore4(inputs)
	return ar_appstoreadmin_listing_iosappstore4(inputs)
});
export { appstoreadmin_listing_iosappstore4 as "appStoreAdmin.listing.iosAppStore" }