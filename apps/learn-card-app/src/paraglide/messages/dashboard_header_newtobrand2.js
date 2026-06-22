/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Dashboard_Header_Newtobrand2Inputs */

const en_dashboard_header_newtobrand2 = /** @type {(inputs: Dashboard_Header_Newtobrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`New to ${i?.brand}`)
};

const es_dashboard_header_newtobrand2 = /** @type {(inputs: Dashboard_Header_Newtobrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nuevo en ${i?.brand}`)
};

const fr_dashboard_header_newtobrand2 = /** @type {(inputs: Dashboard_Header_Newtobrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nouveau sur ${i?.brand}`)
};

const ar_dashboard_header_newtobrand2 = /** @type {(inputs: Dashboard_Header_Newtobrand2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`جديد في ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "New to {brand}" |
*
* @param {Dashboard_Header_Newtobrand2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_newtobrand2 = /** @type {((inputs: Dashboard_Header_Newtobrand2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Newtobrand2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_newtobrand2(inputs)
	if (locale === "es") return es_dashboard_header_newtobrand2(inputs)
	if (locale === "fr") return fr_dashboard_header_newtobrand2(inputs)
	return ar_dashboard_header_newtobrand2(inputs)
});
export { dashboard_header_newtobrand2 as "dashboard.header.newToBrand" }