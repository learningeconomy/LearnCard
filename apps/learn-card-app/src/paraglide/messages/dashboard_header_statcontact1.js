/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Header_Statcontact1Inputs */

const en_dashboard_header_statcontact1 = /** @type {(inputs: Dashboard_Header_Statcontact1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contact`)
};

const es_dashboard_header_statcontact1 = /** @type {(inputs: Dashboard_Header_Statcontact1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contacto`)
};

const fr_dashboard_header_statcontact1 = /** @type {(inputs: Dashboard_Header_Statcontact1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} contact`)
};

const ar_dashboard_header_statcontact1 = /** @type {(inputs: Dashboard_Header_Statcontact1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جهة اتصال`)
};

/**
* | output |
* | --- |
* | "{count} contact" |
*
* @param {Dashboard_Header_Statcontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_statcontact1 = /** @type {((inputs: Dashboard_Header_Statcontact1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Statcontact1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_statcontact1(inputs)
	if (locale === "es") return es_dashboard_header_statcontact1(inputs)
	if (locale === "fr") return fr_dashboard_header_statcontact1(inputs)
	return ar_dashboard_header_statcontact1(inputs)
});
export { dashboard_header_statcontact1 as "dashboard.header.statContact" }