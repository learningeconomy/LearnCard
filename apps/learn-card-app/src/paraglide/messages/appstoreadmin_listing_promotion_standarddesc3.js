/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Standarddesc3Inputs */

const en_appstoreadmin_listing_promotion_standarddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standarddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Normal visibility in search and browse`)
};

const es_appstoreadmin_listing_promotion_standarddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standarddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilidad normal en búsqueda y navegación`)
};

const fr_appstoreadmin_listing_promotion_standarddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standarddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilité normale dans la recherche et la navigation`)
};

const ar_appstoreadmin_listing_promotion_standarddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standarddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ظهور عادي في البحث والتصفح`)
};

/**
* | output |
* | --- |
* | "Normal visibility in search and browse" |
*
* @param {Appstoreadmin_Listing_Promotion_Standarddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_standarddesc3 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Standarddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Standarddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_standarddesc3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_standarddesc3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_standarddesc3(inputs)
	return ar_appstoreadmin_listing_promotion_standarddesc3(inputs)
});
export { appstoreadmin_listing_promotion_standarddesc3 as "appStoreAdmin.listing.promotion.standardDesc" }