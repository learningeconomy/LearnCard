/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Launchconfig3Inputs */

const en_appstoreadmin_listing_launchconfig3 = /** @type {(inputs: Appstoreadmin_Listing_Launchconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch Configuration`)
};

const es_appstoreadmin_listing_launchconfig3 = /** @type {(inputs: Appstoreadmin_Listing_Launchconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración de Lanzamiento`)
};

const fr_appstoreadmin_listing_launchconfig3 = /** @type {(inputs: Appstoreadmin_Listing_Launchconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration de Lancement`)
};

const ar_appstoreadmin_listing_launchconfig3 = /** @type {(inputs: Appstoreadmin_Listing_Launchconfig3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعدادات الإطلاق`)
};

/**
* | output |
* | --- |
* | "Launch Configuration" |
*
* @param {Appstoreadmin_Listing_Launchconfig3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_launchconfig3 = /** @type {((inputs?: Appstoreadmin_Listing_Launchconfig3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Launchconfig3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_launchconfig3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_launchconfig3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_launchconfig3(inputs)
	return ar_appstoreadmin_listing_launchconfig3(inputs)
});
export { appstoreadmin_listing_launchconfig3 as "appStoreAdmin.listing.launchConfig" }