/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs */

const en_appstoreadmin_listing_promotion_curatedlistdesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Included in curated collections`)
};

const es_appstoreadmin_listing_promotion_curatedlistdesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incluido en colecciones seleccionadas`)
};

const fr_appstoreadmin_listing_promotion_curatedlistdesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inclus dans les collections sélectionnées`)
};

const ar_appstoreadmin_listing_promotion_curatedlistdesc4 = /** @type {(inputs: Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مُدرج في مجموعات مختارة`)
};

/**
* | output |
* | --- |
* | "Included in curated collections" |
*
* @param {Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotion_curatedlistdesc4 = /** @type {((inputs?: Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotion_Curatedlistdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotion_curatedlistdesc4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotion_curatedlistdesc4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotion_curatedlistdesc4(inputs)
	return ar_appstoreadmin_listing_promotion_curatedlistdesc4(inputs)
});
export { appstoreadmin_listing_promotion_curatedlistdesc4 as "appStoreAdmin.listing.promotion.curatedListDesc" }