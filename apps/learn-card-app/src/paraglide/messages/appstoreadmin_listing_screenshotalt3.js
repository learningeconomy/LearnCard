/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Appstoreadmin_Listing_Screenshotalt3Inputs */

const en_appstoreadmin_listing_screenshotalt3 = /** @type {(inputs: Appstoreadmin_Listing_Screenshotalt3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Screenshot ${i?.count}`)
};

const es_appstoreadmin_listing_screenshotalt3 = /** @type {(inputs: Appstoreadmin_Listing_Screenshotalt3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Captura ${i?.count}`)
};

const fr_appstoreadmin_listing_screenshotalt3 = /** @type {(inputs: Appstoreadmin_Listing_Screenshotalt3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Capture ${i?.count}`)
};

const ar_appstoreadmin_listing_screenshotalt3 = /** @type {(inputs: Appstoreadmin_Listing_Screenshotalt3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لقطة شاشة ${i?.count}`)
};

/**
* | output |
* | --- |
* | "Screenshot {count}" |
*
* @param {Appstoreadmin_Listing_Screenshotalt3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_screenshotalt3 = /** @type {((inputs: Appstoreadmin_Listing_Screenshotalt3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Screenshotalt3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_screenshotalt3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_screenshotalt3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_screenshotalt3(inputs)
	return ar_appstoreadmin_listing_screenshotalt3(inputs)
});
export { appstoreadmin_listing_screenshotalt3 as "appStoreAdmin.listing.screenshotAlt" }