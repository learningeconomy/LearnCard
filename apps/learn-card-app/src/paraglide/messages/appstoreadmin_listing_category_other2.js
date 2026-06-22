/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Category_Other2Inputs */

const en_appstoreadmin_listing_category_other2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Other2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Other`)
};

const es_appstoreadmin_listing_category_other2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Other2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otro`)
};

const fr_appstoreadmin_listing_category_other2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Other2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autre`)
};

const ar_appstoreadmin_listing_category_other2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Other2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أخرى`)
};

/**
* | output |
* | --- |
* | "Other" |
*
* @param {Appstoreadmin_Listing_Category_Other2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_category_other2 = /** @type {((inputs?: Appstoreadmin_Listing_Category_Other2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Category_Other2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_category_other2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_category_other2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_category_other2(inputs)
	return ar_appstoreadmin_listing_category_other2(inputs)
});
export { appstoreadmin_listing_category_other2 as "appStoreAdmin.listing.category.other" }