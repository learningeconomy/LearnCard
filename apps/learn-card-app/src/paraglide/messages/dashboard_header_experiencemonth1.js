/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Header_Experiencemonth1Inputs */

const en_dashboard_header_experiencemonth1 = /** @type {(inputs: Dashboard_Header_Experiencemonth1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} month experience`)
};

const es_dashboard_header_experiencemonth1 = /** @type {(inputs: Dashboard_Header_Experiencemonth1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} mes de experiencia`)
};

const fr_dashboard_header_experiencemonth1 = /** @type {(inputs: Dashboard_Header_Experiencemonth1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} mois d'expérience`)
};

const ar_dashboard_header_experiencemonth1 = /** @type {(inputs: Dashboard_Header_Experiencemonth1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهر خبرة`)
};

/**
* | output |
* | --- |
* | "{count} month experience" |
*
* @param {Dashboard_Header_Experiencemonth1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_experiencemonth1 = /** @type {((inputs: Dashboard_Header_Experiencemonth1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Experiencemonth1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_experiencemonth1(inputs)
	if (locale === "es") return es_dashboard_header_experiencemonth1(inputs)
	if (locale === "fr") return fr_dashboard_header_experiencemonth1(inputs)
	return ar_dashboard_header_experiencemonth1(inputs)
});
export { dashboard_header_experiencemonth1 as "dashboard.header.experienceMonth" }