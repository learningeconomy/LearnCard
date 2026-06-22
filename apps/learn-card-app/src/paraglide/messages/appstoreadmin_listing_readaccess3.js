/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Readaccess3Inputs */

const en_appstoreadmin_listing_readaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Readaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Read Access`)
};

const es_appstoreadmin_listing_readaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Readaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de Lectura`)
};

const fr_appstoreadmin_listing_readaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Readaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en Lecture`)
};

const ar_appstoreadmin_listing_readaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Readaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صلاحية القراءة`)
};

/**
* | output |
* | --- |
* | "Read Access" |
*
* @param {Appstoreadmin_Listing_Readaccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_readaccess3 = /** @type {((inputs?: Appstoreadmin_Listing_Readaccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Readaccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_readaccess3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_readaccess3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_readaccess3(inputs)
	return ar_appstoreadmin_listing_readaccess3(inputs)
});
export { appstoreadmin_listing_readaccess3 as "appStoreAdmin.listing.readAccess" }