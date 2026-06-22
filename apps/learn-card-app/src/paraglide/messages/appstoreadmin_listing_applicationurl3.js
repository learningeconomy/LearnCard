/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Applicationurl3Inputs */

const en_appstoreadmin_listing_applicationurl3 = /** @type {(inputs: Appstoreadmin_Listing_Applicationurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application URL`)
};

const es_appstoreadmin_listing_applicationurl3 = /** @type {(inputs: Appstoreadmin_Listing_Applicationurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de la Aplicación`)
};

const fr_appstoreadmin_listing_applicationurl3 = /** @type {(inputs: Appstoreadmin_Listing_Applicationurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de l'Application`)
};

const ar_appstoreadmin_listing_applicationurl3 = /** @type {(inputs: Appstoreadmin_Listing_Applicationurl3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط التطبيق`)
};

/**
* | output |
* | --- |
* | "Application URL" |
*
* @param {Appstoreadmin_Listing_Applicationurl3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_applicationurl3 = /** @type {((inputs?: Appstoreadmin_Listing_Applicationurl3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Applicationurl3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_applicationurl3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_applicationurl3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_applicationurl3(inputs)
	return ar_appstoreadmin_listing_applicationurl3(inputs)
});
export { appstoreadmin_listing_applicationurl3 as "appStoreAdmin.listing.applicationUrl" }