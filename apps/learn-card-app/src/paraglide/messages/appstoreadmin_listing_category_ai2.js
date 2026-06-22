/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Category_Ai2Inputs */

const en_appstoreadmin_listing_category_ai2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Ai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI`)
};

const es_appstoreadmin_listing_category_ai2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Ai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const fr_appstoreadmin_listing_category_ai2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Ai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`IA`)
};

const ar_appstoreadmin_listing_category_ai2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Ai2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ذكاء اصطناعي`)
};

/**
* | output |
* | --- |
* | "AI" |
*
* @param {Appstoreadmin_Listing_Category_Ai2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_category_ai2 = /** @type {((inputs?: Appstoreadmin_Listing_Category_Ai2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Category_Ai2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_category_ai2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_category_ai2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_category_ai2(inputs)
	return ar_appstoreadmin_listing_category_ai2(inputs)
});
export { appstoreadmin_listing_category_ai2 as "appStoreAdmin.listing.category.ai" }