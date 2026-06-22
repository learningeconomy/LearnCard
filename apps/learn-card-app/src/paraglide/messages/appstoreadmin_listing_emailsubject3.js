/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Appstoreadmin_Listing_Emailsubject3Inputs */

const en_appstoreadmin_listing_emailsubject3 = /** @type {(inputs: Appstoreadmin_Listing_Emailsubject3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Regarding your app: ${i?.name}`)
};

const es_appstoreadmin_listing_emailsubject3 = /** @type {(inputs: Appstoreadmin_Listing_Emailsubject3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Sobre tu app: ${i?.name}`)
};

const fr_appstoreadmin_listing_emailsubject3 = /** @type {(inputs: Appstoreadmin_Listing_Emailsubject3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`À propos de votre appli : ${i?.name}`)
};

const ar_appstoreadmin_listing_emailsubject3 = /** @type {(inputs: Appstoreadmin_Listing_Emailsubject3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`بخصوص تطبيقك: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Regarding your app: {name}" |
*
* @param {Appstoreadmin_Listing_Emailsubject3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_emailsubject3 = /** @type {((inputs: Appstoreadmin_Listing_Emailsubject3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Emailsubject3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_emailsubject3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_emailsubject3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_emailsubject3(inputs)
	return ar_appstoreadmin_listing_emailsubject3(inputs)
});
export { appstoreadmin_listing_emailsubject3 as "appStoreAdmin.listing.emailSubject" }