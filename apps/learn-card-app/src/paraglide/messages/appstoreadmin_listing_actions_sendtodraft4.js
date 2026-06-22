/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Actions_Sendtodraft4Inputs */

const en_appstoreadmin_listing_actions_sendtodraft4 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Sendtodraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Back to Draft`)
};

const es_appstoreadmin_listing_actions_sendtodraft4 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Sendtodraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a Borrador`)
};

const fr_appstoreadmin_listing_actions_sendtodraft4 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Sendtodraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remettre en Brouillon`)
};

const ar_appstoreadmin_listing_actions_sendtodraft4 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Sendtodraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة إلى المسودة`)
};

/**
* | output |
* | --- |
* | "Send Back to Draft" |
*
* @param {Appstoreadmin_Listing_Actions_Sendtodraft4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_actions_sendtodraft4 = /** @type {((inputs?: Appstoreadmin_Listing_Actions_Sendtodraft4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Actions_Sendtodraft4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_actions_sendtodraft4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_actions_sendtodraft4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_actions_sendtodraft4(inputs)
	return ar_appstoreadmin_listing_actions_sendtodraft4(inputs)
});
export { appstoreadmin_listing_actions_sendtodraft4 as "appStoreAdmin.listing.actions.sendToDraft" }