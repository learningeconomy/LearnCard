/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Writeaccess3Inputs */

const en_appstoreadmin_listing_writeaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Writeaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write Access`)
};

const es_appstoreadmin_listing_writeaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Writeaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de Escritura`)
};

const fr_appstoreadmin_listing_writeaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Writeaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en Écriture`)
};

const ar_appstoreadmin_listing_writeaccess3 = /** @type {(inputs: Appstoreadmin_Listing_Writeaccess3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صلاحية الكتابة`)
};

/**
* | output |
* | --- |
* | "Write Access" |
*
* @param {Appstoreadmin_Listing_Writeaccess3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_writeaccess3 = /** @type {((inputs?: Appstoreadmin_Listing_Writeaccess3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Writeaccess3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_writeaccess3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_writeaccess3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_writeaccess3(inputs)
	return ar_appstoreadmin_listing_writeaccess3(inputs)
});
export { appstoreadmin_listing_writeaccess3 as "appStoreAdmin.listing.writeAccess" }