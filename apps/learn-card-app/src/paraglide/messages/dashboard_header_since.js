/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ date: NonNullable<unknown> }} Dashboard_Header_SinceInputs */

const en_dashboard_header_since = /** @type {(inputs: Dashboard_Header_SinceInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Since ${i?.date}`)
};

const es_dashboard_header_since = /** @type {(inputs: Dashboard_Header_SinceInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Desde ${i?.date}`)
};

const fr_dashboard_header_since = /** @type {(inputs: Dashboard_Header_SinceInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Depuis ${i?.date}`)
};

const ar_dashboard_header_since = /** @type {(inputs: Dashboard_Header_SinceInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`منذ ${i?.date}`)
};

/**
* | output |
* | --- |
* | "Since {date}" |
*
* @param {Dashboard_Header_SinceInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_since = /** @type {((inputs: Dashboard_Header_SinceInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_SinceInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_since(inputs)
	if (locale === "es") return es_dashboard_header_since(inputs)
	if (locale === "fr") return fr_dashboard_header_since(inputs)
	return ar_dashboard_header_since(inputs)
});
export { dashboard_header_since as "dashboard.header.since" }