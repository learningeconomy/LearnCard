/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs */

const en_appstoreadmin_listing_launchtype_consentredirect4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow`)
};

const es_appstoreadmin_listing_launchtype_consentredirect4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de Consentimiento`)
};

const fr_appstoreadmin_listing_launchtype_consentredirect4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux de Consentement`)
};

const ar_appstoreadmin_listing_launchtype_consentredirect4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow" |
*
* @param {Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_launchtype_consentredirect4 = /** @type {((inputs?: Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Launchtype_Consentredirect4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_launchtype_consentredirect4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_launchtype_consentredirect4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_launchtype_consentredirect4(inputs)
	return ar_appstoreadmin_listing_launchtype_consentredirect4(inputs)
});
export { appstoreadmin_listing_launchtype_consentredirect4 as "appStoreAdmin.listing.launchType.consentRedirect" }