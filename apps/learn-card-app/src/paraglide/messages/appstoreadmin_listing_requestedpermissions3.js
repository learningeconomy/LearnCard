/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Listing_Requestedpermissions3Inputs */

const en_appstoreadmin_listing_requestedpermissions3 = /** @type {(inputs: Appstoreadmin_Listing_Requestedpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Requested Permissions`)
};

const es_appstoreadmin_listing_requestedpermissions3 = /** @type {(inputs: Appstoreadmin_Listing_Requestedpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos Solicitados`)
};

const fr_appstoreadmin_listing_requestedpermissions3 = /** @type {(inputs: Appstoreadmin_Listing_Requestedpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions Demandées`)
};

const ar_appstoreadmin_listing_requestedpermissions3 = /** @type {(inputs: Appstoreadmin_Listing_Requestedpermissions3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأذونات المطلوبة`)
};

/**
* | output |
* | --- |
* | "Requested Permissions" |
*
* @param {Appstoreadmin_Listing_Requestedpermissions3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_listing_requestedpermissions3 = /** @type {((inputs?: Appstoreadmin_Listing_Requestedpermissions3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Listing_Requestedpermissions3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_listing_requestedpermissions3(inputs)
	if (locale === "es") return es_appstoreadmin_listing_requestedpermissions3(inputs)
	if (locale === "fr") return fr_appstoreadmin_listing_requestedpermissions3(inputs)
	return ar_appstoreadmin_listing_requestedpermissions3(inputs)
});
export { appstoreadmin_listing_requestedpermissions3 as "appStoreAdmin.listing.requestedPermissions" }