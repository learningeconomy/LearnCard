/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Dashboard_Header_Experienceyear1Inputs */

const en_dashboard_header_experienceyear1 = /** @type {(inputs: Dashboard_Header_Experienceyear1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} yr experience`)
};

const es_dashboard_header_experienceyear1 = /** @type {(inputs: Dashboard_Header_Experienceyear1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} año de experiencia`)
};

const fr_dashboard_header_experienceyear1 = /** @type {(inputs: Dashboard_Header_Experienceyear1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} an d'expérience`)
};

const ar_dashboard_header_experienceyear1 = /** @type {(inputs: Dashboard_Header_Experienceyear1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} سنة خبرة`)
};

/**
* | output |
* | --- |
* | "{count} yr experience" |
*
* @param {Dashboard_Header_Experienceyear1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_experienceyear1 = /** @type {((inputs: Dashboard_Header_Experienceyear1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Experienceyear1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_experienceyear1(inputs)
	if (locale === "es") return es_dashboard_header_experienceyear1(inputs)
	if (locale === "fr") return fr_dashboard_header_experienceyear1(inputs)
	return ar_dashboard_header_experienceyear1(inputs)
});
export { dashboard_header_experienceyear1 as "dashboard.header.experienceYear" }