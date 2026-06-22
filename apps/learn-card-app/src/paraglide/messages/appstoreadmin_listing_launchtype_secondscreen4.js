/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs */

const en_appstoreadmin_listing_launchtype_secondscreen4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Second Screen`)
};

const es_appstoreadmin_listing_launchtype_secondscreen4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Segunda Pantalla`)
};

const fr_appstoreadmin_listing_launchtype_secondscreen4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deuxième Écran`)
};

const ar_appstoreadmin_listing_launchtype_secondscreen4 = /** @type {(inputs: Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شاشة ثانية`)
};

/**
* | output |
* | --- |
* | "Second Screen" |
*
* @param {Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_launchtype_secondscreen4 = /** @type {((inputs?: Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Launchtype_Secondscreen4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_launchtype_secondscreen4(inputs)
	if (locale === "es") return es_appstoreadmin_listing_launchtype_secondscreen4(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_launchtype_secondscreen4(inputs)
	return ar_appstoreadmin_listing_launchtype_secondscreen4(inputs)
});
export { appstoreadmin_listing_launchtype_secondscreen4 as "appStoreAdmin.listing.launchType.secondScreen" }