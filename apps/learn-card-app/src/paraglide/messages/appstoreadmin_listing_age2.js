/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ rating: NonNullable<unknown> }} Appstoreadmin_Listing_Age2Inputs */

const en_appstoreadmin_listing_age2 = /** @type {(inputs: Appstoreadmin_Listing_Age2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Age ${i?.rating}`)
};

const es_appstoreadmin_listing_age2 = /** @type {(inputs: Appstoreadmin_Listing_Age2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Edad ${i?.rating}`)
};

const fr_appstoreadmin_listing_age2 = /** @type {(inputs: Appstoreadmin_Listing_Age2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Âge ${i?.rating}`)
};

const ar_appstoreadmin_listing_age2 = /** @type {(inputs: Appstoreadmin_Listing_Age2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`العمر ${i?.rating}`)
};

/**
* | output |
* | --- |
* | "Age {rating}" |
*
* @param {Appstoreadmin_Listing_Age2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_age2 = /** @type {((inputs: Appstoreadmin_Listing_Age2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Age2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_age2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_age2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_age2(inputs)
	return ar_appstoreadmin_listing_age2(inputs)
});
export { appstoreadmin_listing_age2 as "appStoreAdmin.listing.age" }