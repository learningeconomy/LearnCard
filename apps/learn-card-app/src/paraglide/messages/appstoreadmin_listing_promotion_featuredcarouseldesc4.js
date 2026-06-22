/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs */

const en_appstoreadmin_listing_promotion_featuredcarouseldesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prominently displayed in the featured section`)
};

const es_appstoreadmin_listing_promotion_featuredcarouseldesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrado de forma destacada en la sección principal`)
};

const fr_appstoreadmin_listing_promotion_featuredcarouseldesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affiché en évidence dans la section en vedette`)
};

const ar_appstoreadmin_listing_promotion_featuredcarouseldesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يظهر بشكل بارز في قسم المميزات`)
};

/**
* | output |
* | --- |
* | "Prominently displayed in the featured section" |
*
* @param {Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_featuredcarouseldesc4 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Featuredcarouseldesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_featuredcarouseldesc4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_featuredcarouseldesc4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_featuredcarouseldesc4(inputs)
	return ar_appstoreadmin_listing_promotion_featuredcarouseldesc4(inputs)
});
export { appstoreadmin_listing_promotion_featuredcarouseldesc4 as "appStoreAdmin.listing.promotion.featuredCarouselDesc" }