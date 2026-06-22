/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Curatedlist3Inputs */

const en_appstoreadmin_listing_promotion_curatedlist3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlist3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Curated List`)
};

const es_appstoreadmin_listing_promotion_curatedlist3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlist3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lista Seleccionada`)
};

const fr_appstoreadmin_listing_promotion_curatedlist3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlist3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liste Sélectionnée`)
};

const ar_appstoreadmin_listing_promotion_curatedlist3 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlist3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قائمة مختارة`)
};

/**
* | output |
* | --- |
* | "Curated List" |
*
* @param {Appstoreadmin_Listing_Promotion_Curatedlist3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_curatedlist3 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Curatedlist3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Curatedlist3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_curatedlist3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_curatedlist3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_curatedlist3(inputs)
	return ar_appstoreadmin_listing_promotion_curatedlist3(inputs)
});
export { appstoreadmin_listing_promotion_curatedlist3 as "appStoreAdmin.listing.promotion.curatedList" }