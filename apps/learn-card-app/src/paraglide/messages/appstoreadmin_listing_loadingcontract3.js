/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Loadingcontract3Inputs */

const en_appstoreadmin_listing_loadingcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Loadingcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading contract...`)
};

const es_appstoreadmin_listing_loadingcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Loadingcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando contrato...`)
};

const fr_appstoreadmin_listing_loadingcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Loadingcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du contrat...`)
};

const ar_appstoreadmin_listing_loadingcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Loadingcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل العقد...`)
};

/**
* | output |
* | --- |
* | "Loading contract..." |
*
* @param {Appstoreadmin_Listing_Loadingcontract3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_loadingcontract3 = /** @type {((inputs?: Appstoreadmin_Listing_Loadingcontract3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Loadingcontract3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_loadingcontract3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_loadingcontract3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_loadingcontract3(inputs)
	return ar_appstoreadmin_listing_loadingcontract3(inputs)
});
export { appstoreadmin_listing_loadingcontract3 as "appStoreAdmin.listing.loadingContract" }