/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Termsofservice4Inputs */

const en_appstoreadmin_listing_termsofservice4 = /** @type {(inputs: Appstoreadmin_Listing_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_appstoreadmin_listing_termsofservice4 = /** @type {(inputs: Appstoreadmin_Listing_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos del Servicio`)
};

const fr_appstoreadmin_listing_termsofservice4 = /** @type {(inputs: Appstoreadmin_Listing_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'Utilisation`)
};

const ar_appstoreadmin_listing_termsofservice4 = /** @type {(inputs: Appstoreadmin_Listing_Termsofservice4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Appstoreadmin_Listing_Termsofservice4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_termsofservice4 = /** @type {((inputs?: Appstoreadmin_Listing_Termsofservice4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Termsofservice4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_termsofservice4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_termsofservice4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_termsofservice4(inputs)
	return ar_appstoreadmin_listing_termsofservice4(inputs)
});
export { appstoreadmin_listing_termsofservice4 as "appStoreAdmin.listing.termsOfService" }