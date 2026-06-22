/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Unknowndate3Inputs */

const en_appstoreadmin_listing_unknowndate3 = /** @type {(inputs: Appstoreadmin_Listing_Unknowndate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unknown Date`)
};

const es_appstoreadmin_listing_unknowndate3 = /** @type {(inputs: Appstoreadmin_Listing_Unknowndate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha Desconocida`)
};

const fr_appstoreadmin_listing_unknowndate3 = /** @type {(inputs: Appstoreadmin_Listing_Unknowndate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date Inconnue`)
};

const ar_appstoreadmin_listing_unknowndate3 = /** @type {(inputs: Appstoreadmin_Listing_Unknowndate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ غير معروف`)
};

/**
* | output |
* | --- |
* | "Unknown Date" |
*
* @param {Appstoreadmin_Listing_Unknowndate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_unknowndate3 = /** @type {((inputs?: Appstoreadmin_Listing_Unknowndate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Unknowndate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_unknowndate3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_unknowndate3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_unknowndate3(inputs)
	return ar_appstoreadmin_listing_unknowndate3(inputs)
});
export { appstoreadmin_listing_unknowndate3 as "appStoreAdmin.listing.unknownDate" }