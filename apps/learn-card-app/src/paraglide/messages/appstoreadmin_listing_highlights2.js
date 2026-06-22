/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Highlights2Inputs */

const en_appstoreadmin_listing_highlights2 = /** @type {(inputs: Appstoreadmin_Listing_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlights`)
};

const es_appstoreadmin_listing_highlights2 = /** @type {(inputs: Appstoreadmin_Listing_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aspectos destacados`)
};

const fr_appstoreadmin_listing_highlights2 = /** @type {(inputs: Appstoreadmin_Listing_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Points forts`)
};

const ar_appstoreadmin_listing_highlights2 = /** @type {(inputs: Appstoreadmin_Listing_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أبرز النقاط`)
};

/**
* | output |
* | --- |
* | "Highlights" |
*
* @param {Appstoreadmin_Listing_Highlights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_highlights2 = /** @type {((inputs?: Appstoreadmin_Listing_Highlights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Highlights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_highlights2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_highlights2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_highlights2(inputs)
	return ar_appstoreadmin_listing_highlights2(inputs)
});
export { appstoreadmin_listing_highlights2 as "appStoreAdmin.listing.highlights" }