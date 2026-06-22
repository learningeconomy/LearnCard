/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Actions_Approve2Inputs */

const en_appstoreadmin_listing_actions_approve2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Approve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approve`)
};

const es_appstoreadmin_listing_actions_approve2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Approve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprobar`)
};

const fr_appstoreadmin_listing_actions_approve2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Approve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Approuver`)
};

const ar_appstoreadmin_listing_actions_approve2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Approve2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موافقة`)
};

/**
* | output |
* | --- |
* | "Approve" |
*
* @param {Appstoreadmin_Listing_Actions_Approve2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_actions_approve2 = /** @type {((inputs?: Appstoreadmin_Listing_Actions_Approve2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Actions_Approve2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_actions_approve2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_actions_approve2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_actions_approve2(inputs)
	return ar_appstoreadmin_listing_actions_approve2(inputs)
});
export { appstoreadmin_listing_actions_approve2 as "appStoreAdmin.listing.actions.approve" }