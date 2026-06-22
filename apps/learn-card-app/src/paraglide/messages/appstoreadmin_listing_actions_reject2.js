/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Actions_Reject2Inputs */

const en_appstoreadmin_listing_actions_reject2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Reject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reject`)
};

const es_appstoreadmin_listing_actions_reject2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Reject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechazar`)
};

const fr_appstoreadmin_listing_actions_reject2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Reject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rejeter`)
};

const ar_appstoreadmin_listing_actions_reject2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Reject2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفض`)
};

/**
* | output |
* | --- |
* | "Reject" |
*
* @param {Appstoreadmin_Listing_Actions_Reject2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_actions_reject2 = /** @type {((inputs?: Appstoreadmin_Listing_Actions_Reject2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Actions_Reject2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_actions_reject2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_actions_reject2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_actions_reject2(inputs)
	return ar_appstoreadmin_listing_actions_reject2(inputs)
});
export { appstoreadmin_listing_actions_reject2 as "appStoreAdmin.listing.actions.reject" }