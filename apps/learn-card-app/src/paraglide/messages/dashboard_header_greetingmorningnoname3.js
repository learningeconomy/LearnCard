/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Greetingmorningnoname3Inputs */

const en_dashboard_header_greetingmorningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingmorningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good morning.`)
};

const es_dashboard_header_greetingmorningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingmorningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buenos días.`)
};

const fr_dashboard_header_greetingmorningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingmorningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bonjour.`)
};

const ar_dashboard_header_greetingmorningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingmorningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صباح الخير.`)
};

/**
* | output |
* | --- |
* | "Good morning." |
*
* @param {Dashboard_Header_Greetingmorningnoname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_greetingmorningnoname3 = /** @type {((inputs?: Dashboard_Header_Greetingmorningnoname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Greetingmorningnoname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_greetingmorningnoname3(inputs)
	if (locale === "es") return es_dashboard_header_greetingmorningnoname3(inputs)
	if (locale === "fr") return fr_dashboard_header_greetingmorningnoname3(inputs)
	return ar_dashboard_header_greetingmorningnoname3(inputs)
});
export { dashboard_header_greetingmorningnoname3 as "dashboard.header.greetingMorningNoName" }