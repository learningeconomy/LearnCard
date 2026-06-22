/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Externallinks3Inputs */

const en_appstoreadmin_listing_externallinks3 = /** @type {(inputs: Appstoreadmin_Listing_Externallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`External Links`)
};

const es_appstoreadmin_listing_externallinks3 = /** @type {(inputs: Appstoreadmin_Listing_Externallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlaces Externos`)
};

const fr_appstoreadmin_listing_externallinks3 = /** @type {(inputs: Appstoreadmin_Listing_Externallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens Externes`)
};

const ar_appstoreadmin_listing_externallinks3 = /** @type {(inputs: Appstoreadmin_Listing_Externallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط خارجية`)
};

/**
* | output |
* | --- |
* | "External Links" |
*
* @param {Appstoreadmin_Listing_Externallinks3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_externallinks3 = /** @type {((inputs?: Appstoreadmin_Listing_Externallinks3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Externallinks3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_externallinks3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_externallinks3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_externallinks3(inputs)
	return ar_appstoreadmin_listing_externallinks3(inputs)
});
export { appstoreadmin_listing_externallinks3 as "appStoreAdmin.listing.externalLinks" }