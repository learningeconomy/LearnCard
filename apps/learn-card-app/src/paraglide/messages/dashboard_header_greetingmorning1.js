/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Header_Greetingmorning1Inputs */

const en_dashboard_header_greetingmorning1 = /** @type {(inputs: Dashboard_Header_Greetingmorning1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Good morning, ${i?.name}.`)
};

const es_dashboard_header_greetingmorning1 = /** @type {(inputs: Dashboard_Header_Greetingmorning1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buenos días, ${i?.name}.`)
};

const fr_dashboard_header_greetingmorning1 = /** @type {(inputs: Dashboard_Header_Greetingmorning1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bonjour, ${i?.name}.`)
};

const ar_dashboard_header_greetingmorning1 = /** @type {(inputs: Dashboard_Header_Greetingmorning1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`صباح الخير، ${i?.name}.`)
};

/**
* | output |
* | --- |
* | "Good morning, {name}." |
*
* @param {Dashboard_Header_Greetingmorning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_greetingmorning1 = /** @type {((inputs: Dashboard_Header_Greetingmorning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Greetingmorning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_greetingmorning1(inputs)
	if (locale === "es") return es_dashboard_header_greetingmorning1(inputs)
	if (locale === "fr") return fr_dashboard_header_greetingmorning1(inputs)
	return ar_dashboard_header_greetingmorning1(inputs)
});
export { dashboard_header_greetingmorning1 as "dashboard.header.greetingMorning" }