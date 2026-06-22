/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Contracttitle3Inputs */

const en_appstoreadmin_listing_contracttitle3 = /** @type {(inputs: Appstoreadmin_Listing_Contracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent Flow Contract`)
};

const es_appstoreadmin_listing_contracttitle3 = /** @type {(inputs: Appstoreadmin_Listing_Contracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrato de Flujo de Consentimiento`)
};

const fr_appstoreadmin_listing_contracttitle3 = /** @type {(inputs: Appstoreadmin_Listing_Contracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrat de Flux de Consentement`)
};

const ar_appstoreadmin_listing_contracttitle3 = /** @type {(inputs: Appstoreadmin_Listing_Contracttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عقد تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Consent Flow Contract" |
*
* @param {Appstoreadmin_Listing_Contracttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_contracttitle3 = /** @type {((inputs?: Appstoreadmin_Listing_Contracttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Contracttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_contracttitle3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_contracttitle3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_contracttitle3(inputs)
	return ar_appstoreadmin_listing_contracttitle3(inputs)
});
export { appstoreadmin_listing_contracttitle3 as "appStoreAdmin.listing.contractTitle" }