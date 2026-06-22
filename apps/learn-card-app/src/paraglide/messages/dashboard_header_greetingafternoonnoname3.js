/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Greetingafternoonnoname3Inputs */

const en_dashboard_header_greetingafternoonnoname3 = /** @type {(inputs: Dashboard_Header_Greetingafternoonnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good afternoon.`)
};

const es_dashboard_header_greetingafternoonnoname3 = /** @type {(inputs: Dashboard_Header_Greetingafternoonnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buenas tardes.`)
};

const fr_dashboard_header_greetingafternoonnoname3 = /** @type {(inputs: Dashboard_Header_Greetingafternoonnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bon après-midi.`)
};

const ar_dashboard_header_greetingafternoonnoname3 = /** @type {(inputs: Dashboard_Header_Greetingafternoonnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مساء الخير.`)
};

/**
* | output |
* | --- |
* | "Good afternoon." |
*
* @param {Dashboard_Header_Greetingafternoonnoname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_greetingafternoonnoname3 = /** @type {((inputs?: Dashboard_Header_Greetingafternoonnoname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Greetingafternoonnoname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_greetingafternoonnoname3(inputs)
	if (locale === "es") return es_dashboard_header_greetingafternoonnoname3(inputs)
	if (locale === "fr") return fr_dashboard_header_greetingafternoonnoname3(inputs)
	return ar_dashboard_header_greetingafternoonnoname3(inputs)
});
export { dashboard_header_greetingafternoonnoname3 as "dashboard.header.greetingAfternoonNoName" }