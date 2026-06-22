/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs */

const en_appstoreadmin_listing_actions_rejectedmsg3 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This listing was rejected. Send it back as a draft for revision.`)
};

const es_appstoreadmin_listing_actions_rejectedmsg3 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este listado fue rechazado. Envíalo de vuelta como borrador para revisión.`)
};

const fr_appstoreadmin_listing_actions_rejectedmsg3 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette annonce a été rejetée. Renvoyez-la comme brouillon pour révision.`)
};

const ar_appstoreadmin_listing_actions_rejectedmsg3 = /** @type {(inputs: Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم رفض هذه القائمة. أعد إرسالها كمسودة للمراجعة.`)
};

/**
* | output |
* | --- |
* | "This listing was rejected. Send it back as a draft for revision." |
*
* @param {Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_actions_rejectedmsg3 = /** @type {((inputs?: Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Actions_Rejectedmsg3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_actions_rejectedmsg3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_actions_rejectedmsg3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_actions_rejectedmsg3(inputs)
	return ar_appstoreadmin_listing_actions_rejectedmsg3(inputs)
});
export { appstoreadmin_listing_actions_rejectedmsg3 as "appStoreAdmin.listing.actions.rejectedMsg" }