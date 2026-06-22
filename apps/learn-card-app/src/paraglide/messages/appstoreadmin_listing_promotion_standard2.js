/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Standard2Inputs */

const en_appstoreadmin_listing_promotion_standard2 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const es_appstoreadmin_listing_promotion_standard2 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estándar`)
};

const fr_appstoreadmin_listing_promotion_standard2 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Standard`)
};

const ar_appstoreadmin_listing_promotion_standard2 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Standard2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قياسي`)
};

/**
* | output |
* | --- |
* | "Standard" |
*
* @param {Appstoreadmin_Listing_Promotion_Standard2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_standard2 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Standard2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Standard2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_standard2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_standard2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_standard2(inputs)
	return ar_appstoreadmin_listing_promotion_standard2(inputs)
});
export { appstoreadmin_listing_promotion_standard2 as "appStoreAdmin.listing.promotion.standard" }