/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs */

const en_appstoreadmin_listing_promotion_demoteddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reduced visibility in listings`)
};

const es_appstoreadmin_listing_promotion_demoteddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilidad reducida en los listados`)
};

const fr_appstoreadmin_listing_promotion_demoteddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visibilité réduite dans les annonces`)
};

const ar_appstoreadmin_listing_promotion_demoteddesc3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ظهور مخفض في القوائم`)
};

/**
* | output |
* | --- |
* | "Reduced visibility in listings" |
*
* @param {Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_demoteddesc3 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Demoteddesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_demoteddesc3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_demoteddesc3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_demoteddesc3(inputs)
	return ar_appstoreadmin_listing_promotion_demoteddesc3(inputs)
});
export { appstoreadmin_listing_promotion_demoteddesc3 as "appStoreAdmin.listing.promotion.demotedDesc" }