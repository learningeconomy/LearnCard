/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs */

const en_appstoreadmin_listing_launchtype_embeddediframe4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Embedded Iframe`)
};

const es_appstoreadmin_listing_launchtype_embeddediframe4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iframe Integrado`)
};

const fr_appstoreadmin_listing_launchtype_embeddediframe4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iframe Intégré`)
};

const ar_appstoreadmin_listing_launchtype_embeddediframe4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iframe مضمّن`)
};

/**
* | output |
* | --- |
* | "Embedded Iframe" |
*
* @param {Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_launchtype_embeddediframe4 = /** @type {((inputs?: Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Launchtype_Embeddediframe4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_launchtype_embeddediframe4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_launchtype_embeddediframe4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_launchtype_embeddediframe4(inputs)
	return ar_appstoreadmin_listing_launchtype_embeddediframe4(inputs)
});
export { appstoreadmin_listing_launchtype_embeddediframe4 as "appStoreAdmin.listing.launchType.embeddedIframe" }