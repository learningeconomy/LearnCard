/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Category_Games2Inputs */

const en_appstoreadmin_listing_category_games2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Games2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Games`)
};

const es_appstoreadmin_listing_category_games2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Games2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Juegos`)
};

const fr_appstoreadmin_listing_category_games2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Games2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeux`)
};

const ar_appstoreadmin_listing_category_games2 = /** @type {(inputs: Appstoreadmin_Listing_Category_Games2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ألعاب`)
};

/**
* | output |
* | --- |
* | "Games" |
*
* @param {Appstoreadmin_Listing_Category_Games2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_category_games2 = /** @type {((inputs?: Appstoreadmin_Listing_Category_Games2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Category_Games2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_category_games2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_category_games2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_category_games2(inputs)
	return ar_appstoreadmin_listing_category_games2(inputs)
});
export { appstoreadmin_listing_category_games2 as "appStoreAdmin.listing.category.games" }