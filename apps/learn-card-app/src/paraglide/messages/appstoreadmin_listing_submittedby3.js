/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Submittedby3Inputs */

const en_appstoreadmin_listing_submittedby3 = /** @type {(inputs: Appstoreadmin_Listing_Submittedby3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Submitted by:`)
};

const es_appstoreadmin_listing_submittedby3 = /** @type {(inputs: Appstoreadmin_Listing_Submittedby3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviado por:`)
};

const fr_appstoreadmin_listing_submittedby3 = /** @type {(inputs: Appstoreadmin_Listing_Submittedby3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soumis par :`)
};

const ar_appstoreadmin_listing_submittedby3 = /** @type {(inputs: Appstoreadmin_Listing_Submittedby3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقدم من:`)
};

/**
* | output |
* | --- |
* | "Submitted by:" |
*
* @param {Appstoreadmin_Listing_Submittedby3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_submittedby3 = /** @type {((inputs?: Appstoreadmin_Listing_Submittedby3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Submittedby3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_submittedby3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_submittedby3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_submittedby3(inputs)
	return ar_appstoreadmin_listing_submittedby3(inputs)
});
export { appstoreadmin_listing_submittedby3 as "appStoreAdmin.listing.submittedBy" }