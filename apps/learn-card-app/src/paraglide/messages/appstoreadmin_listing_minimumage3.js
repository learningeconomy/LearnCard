/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Minimumage3Inputs */

const en_appstoreadmin_listing_minimumage3 = /** @type {(inputs: Appstoreadmin_Listing_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minimum Age`)
};

const es_appstoreadmin_listing_minimumage3 = /** @type {(inputs: Appstoreadmin_Listing_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edad Mínima`)
};

const fr_appstoreadmin_listing_minimumage3 = /** @type {(inputs: Appstoreadmin_Listing_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Âge Minimum`)
};

const ar_appstoreadmin_listing_minimumage3 = /** @type {(inputs: Appstoreadmin_Listing_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحد الأدنى للعمر`)
};

/**
* | output |
* | --- |
* | "Minimum Age" |
*
* @param {Appstoreadmin_Listing_Minimumage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_minimumage3 = /** @type {((inputs?: Appstoreadmin_Listing_Minimumage3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Minimumage3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_minimumage3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_minimumage3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_minimumage3(inputs)
	return ar_appstoreadmin_listing_minimumage3(inputs)
});
export { appstoreadmin_listing_minimumage3 as "appStoreAdmin.listing.minimumAge" }