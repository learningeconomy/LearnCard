/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Header_Statcredential1Inputs */

const en_dashboard_header_statcredential1 = /** @type {(inputs: Dashboard_Header_Statcredential1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential`)
};

const es_dashboard_header_statcredential1 = /** @type {(inputs: Dashboard_Header_Statcredential1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credencial`)
};

const fr_dashboard_header_statcredential1 = /** @type {(inputs: Dashboard_Header_Statcredential1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} certification`)
};

const ar_dashboard_header_statcredential1 = /** @type {(inputs: Dashboard_Header_Statcredential1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة`)
};

/**
* | output |
* | --- |
* | "{count} credential" |
*
* @param {Dashboard_Header_Statcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_statcredential1 = /** @type {((inputs: Dashboard_Header_Statcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Statcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_statcredential1(inputs)
	if (locale === "es") return es_dashboard_header_statcredential1(inputs)
	if (locale === "fr") return fr_dashboard_header_statcredential1(inputs)
	return ar_dashboard_header_statcredential1(inputs)
});
export { dashboard_header_statcredential1 as "dashboard.header.statCredential" }