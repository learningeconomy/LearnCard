/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Contractnotavailable4Inputs */

const en_appstoreadmin_listing_contractnotavailable4 = /** @type {(inputs: Appstoreadmin_Listing_Contractnotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contract details not available`)
};

const es_appstoreadmin_listing_contractnotavailable4 = /** @type {(inputs: Appstoreadmin_Listing_Contractnotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles del contrato no disponibles`)
};

const fr_appstoreadmin_listing_contractnotavailable4 = /** @type {(inputs: Appstoreadmin_Listing_Contractnotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails du contrat non disponibles`)
};

const ar_appstoreadmin_listing_contractnotavailable4 = /** @type {(inputs: Appstoreadmin_Listing_Contractnotavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل العقد غير متوفرة`)
};

/**
* | output |
* | --- |
* | "Contract details not available" |
*
* @param {Appstoreadmin_Listing_Contractnotavailable4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_contractnotavailable4 = /** @type {((inputs?: Appstoreadmin_Listing_Contractnotavailable4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Contractnotavailable4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_contractnotavailable4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_contractnotavailable4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_contractnotavailable4(inputs)
	return ar_appstoreadmin_listing_contractnotavailable4(inputs)
});
export { appstoreadmin_listing_contractnotavailable4 as "appStoreAdmin.listing.contractNotAvailable" }