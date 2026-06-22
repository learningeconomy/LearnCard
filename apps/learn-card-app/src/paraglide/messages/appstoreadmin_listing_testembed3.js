/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Testembed3Inputs */

const en_appstoreadmin_listing_testembed3 = /** @type {(inputs: Appstoreadmin_Listing_Testembed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Embed`)
};

const es_appstoreadmin_listing_testembed3 = /** @type {(inputs: Appstoreadmin_Listing_Testembed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar Integración`)
};

const fr_appstoreadmin_listing_testembed3 = /** @type {(inputs: Appstoreadmin_Listing_Testembed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester l'Intégration`)
};

const ar_appstoreadmin_listing_testembed3 = /** @type {(inputs: Appstoreadmin_Listing_Testembed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار التضمين`)
};

/**
* | output |
* | --- |
* | "Test Embed" |
*
* @param {Appstoreadmin_Listing_Testembed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_testembed3 = /** @type {((inputs?: Appstoreadmin_Listing_Testembed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Testembed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_testembed3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_testembed3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_testembed3(inputs)
	return ar_appstoreadmin_listing_testembed3(inputs)
});
export { appstoreadmin_listing_testembed3 as "appStoreAdmin.listing.testEmbed" }