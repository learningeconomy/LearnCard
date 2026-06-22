/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Category_Learning2Inputs */

const en_appstoreadmin_listing_category_learning2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Learning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning`)
};

const es_appstoreadmin_listing_category_learning2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Learning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprendizaje`)
};

const fr_appstoreadmin_listing_category_learning2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Learning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apprentissage`)
};

const ar_appstoreadmin_listing_category_learning2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Learning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعلم`)
};

/**
* | output |
* | --- |
* | "Learning" |
*
* @param {Appstoreadmin_Listing_Category_Learning2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_category_learning2 = /** @type {((inputs?: Appstoreadmin_Listing_Category_Learning2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Category_Learning2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_category_learning2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_category_learning2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_category_learning2(inputs)
	return ar_appstoreadmin_listing_category_learning2(inputs)
});
export { appstoreadmin_listing_category_learning2 as "appStoreAdmin.listing.category.learning" }