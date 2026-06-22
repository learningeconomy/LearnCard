/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Scanqraria2Inputs */

const en_dashboard_header_scanqraria2 = /** @type {(inputs: Dashboard_Header_Scanqraria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open QR scanner`)
};

const es_dashboard_header_scanqraria2 = /** @type {(inputs: Dashboard_Header_Scanqraria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir el escáner de QR`)
};

const fr_dashboard_header_scanqraria2 = /** @type {(inputs: Dashboard_Header_Scanqraria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le scanner de QR`)
};

const ar_dashboard_header_scanqraria2 = /** @type {(inputs: Dashboard_Header_Scanqraria2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح ماسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Open QR scanner" |
*
* @param {Dashboard_Header_Scanqraria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_scanqraria2 = /** @type {((inputs?: Dashboard_Header_Scanqraria2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Scanqraria2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_scanqraria2(inputs)
	if (locale === "es") return es_dashboard_header_scanqraria2(inputs)
	if (locale === "fr") return fr_dashboard_header_scanqraria2(inputs)
	return ar_dashboard_header_scanqraria2(inputs)
});
export { dashboard_header_scanqraria2 as "dashboard.header.scanQrAria" }