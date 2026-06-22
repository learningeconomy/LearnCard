/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Dashboard_Header_Greetingafternoon1Inputs */

const en_dashboard_header_greetingafternoon1 = /** @type {(inputs: Dashboard_Header_Greetingafternoon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Good afternoon, ${i?.name}.`)
};

const es_dashboard_header_greetingafternoon1 = /** @type {(inputs: Dashboard_Header_Greetingafternoon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Buenas tardes, ${i?.name}.`)
};

const fr_dashboard_header_greetingafternoon1 = /** @type {(inputs: Dashboard_Header_Greetingafternoon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bon après-midi, ${i?.name}.`)
};

const ar_dashboard_header_greetingafternoon1 = /** @type {(inputs: Dashboard_Header_Greetingafternoon1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مساء الخير، ${i?.name}.`)
};

/**
* | output |
* | --- |
* | "Good afternoon, {name}." |
*
* @param {Dashboard_Header_Greetingafternoon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_greetingafternoon1 = /** @type {((inputs: Dashboard_Header_Greetingafternoon1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Greetingafternoon1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_greetingafternoon1(inputs)
	if (locale === "es") return es_dashboard_header_greetingafternoon1(inputs)
	if (locale === "fr") return fr_dashboard_header_greetingafternoon1(inputs)
	return ar_dashboard_header_greetingafternoon1(inputs)
});
export { dashboard_header_greetingafternoon1 as "dashboard.header.greetingAfternoon" }