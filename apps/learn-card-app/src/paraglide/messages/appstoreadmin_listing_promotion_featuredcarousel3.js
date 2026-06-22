/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs */

const en_appstoreadmin_listing_promotion_featuredcarousel3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Featured Carousel`)
};

const es_appstoreadmin_listing_promotion_featuredcarousel3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrusel Destacado`)
};

const fr_appstoreadmin_listing_promotion_featuredcarousel3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Carrousel Vedette`)
};

const ar_appstoreadmin_listing_promotion_featuredcarousel3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض دوار مميز`)
};

/**
* | output |
* | --- |
* | "Featured Carousel" |
*
* @param {Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_featuredcarousel3 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Featuredcarousel3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_featuredcarousel3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_featuredcarousel3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_featuredcarousel3(inputs)
	return ar_appstoreadmin_listing_promotion_featuredcarousel3(inputs)
});
export { appstoreadmin_listing_promotion_featuredcarousel3 as "appStoreAdmin.listing.promotion.featuredCarousel" }