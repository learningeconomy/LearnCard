/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Promotiontitle3Inputs */

const en_appstoreadmin_listing_promotiontitle3 = /** @type {(inputs: Appstoreadmin_Listing_Promotiontitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Promotion Level`)
};

const es_appstoreadmin_listing_promotiontitle3 = /** @type {(inputs: Appstoreadmin_Listing_Promotiontitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nivel de Promoción`)
};

const fr_appstoreadmin_listing_promotiontitle3 = /** @type {(inputs: Appstoreadmin_Listing_Promotiontitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Niveau de Promotion`)
};

const ar_appstoreadmin_listing_promotiontitle3 = /** @type {(inputs: Appstoreadmin_Listing_Promotiontitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مستوى الترويج`)
};

/**
* | output |
* | --- |
* | "Promotion Level" |
*
* @param {Appstoreadmin_Listing_Promotiontitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_promotiontitle3 = /** @type {((inputs?: Appstoreadmin_Listing_Promotiontitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Promotiontitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_promotiontitle3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_promotiontitle3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_promotiontitle3(inputs)
	return ar_appstoreadmin_listing_promotiontitle3(inputs)
});
export { appstoreadmin_listing_promotiontitle3 as "appStoreAdmin.listing.promotionTitle" }