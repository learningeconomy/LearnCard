/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Actions_Unlist2Inputs */

const en_appstoreadmin_listing_actions_unlist2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Unlist2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unlist App`)
};

const es_appstoreadmin_listing_actions_unlist2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Unlist2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar de la Lista`)
};

const fr_appstoreadmin_listing_actions_unlist2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Unlist2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer de la Liste`)
};

const ar_appstoreadmin_listing_actions_unlist2 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Unlist2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إزالة من القائمة`)
};

/**
* | output |
* | --- |
* | "Unlist App" |
*
* @param {Appstoreadmin_Listing_Actions_Unlist2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_actions_unlist2 = /** @type {((inputs?: Appstoreadmin_Listing_Actions_Unlist2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Actions_Unlist2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_actions_unlist2(inputs)
	if (locale === "es") return es_appstoreadmin_listing_actions_unlist2(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_actions_unlist2(inputs)
	return ar_appstoreadmin_listing_actions_unlist2(inputs)
});
export { appstoreadmin_listing_actions_unlist2 as "appStoreAdmin.listing.actions.unlist" }