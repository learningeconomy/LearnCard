/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Category_Employment2Inputs */

const en_appstoreadmin_listing_category_employment2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Employment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Employment`)
};

const es_appstoreadmin_listing_category_employment2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Employment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empleo`)
};

const fr_appstoreadmin_listing_category_employment2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Employment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi`)
};

const ar_appstoreadmin_listing_category_employment2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Employment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توظيف`)
};

/**
* | output |
* | --- |
* | "Employment" |
*
* @param {Appstoreadmin_Listing_Category_Employment2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_category_employment2 = /** @type {((inputs?: Appstoreadmin_Listing_Category_Employment2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Category_Employment2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_category_employment2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_category_employment2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_category_employment2(inputs)
	return ar_appstoreadmin_listing_category_employment2(inputs)
});
export { appstoreadmin_listing_category_employment2 as "appStoreAdmin.listing.category.employment" }