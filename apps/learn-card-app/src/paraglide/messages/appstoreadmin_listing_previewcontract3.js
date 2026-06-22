/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Previewcontract3Inputs */

const en_appstoreadmin_listing_previewcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Previewcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview Contract`)
};

const es_appstoreadmin_listing_previewcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Previewcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa del Contrato`)
};

const fr_appstoreadmin_listing_previewcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Previewcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du Contrat`)
};

const ar_appstoreadmin_listing_previewcontract3 = /** @type {(inputs: Appstoreadmin_Listing_Previewcontract3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة العقد`)
};

/**
* | output |
* | --- |
* | "Preview Contract" |
*
* @param {Appstoreadmin_Listing_Previewcontract3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_previewcontract3 = /** @type {((inputs?: Appstoreadmin_Listing_Previewcontract3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Previewcontract3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_previewcontract3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_previewcontract3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_previewcontract3(inputs)
	return ar_appstoreadmin_listing_previewcontract3(inputs)
});
export { appstoreadmin_listing_previewcontract3 as "appStoreAdmin.listing.previewContract" }