/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Header_Greetingeveningnoname3Inputs */

const en_dashboard_header_greetingeveningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingeveningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Good evening.`)
};

const es_dashboard_header_greetingeveningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingeveningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buenas noches.`)
};

const fr_dashboard_header_greetingeveningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingeveningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bonsoir.`)
};

const ar_dashboard_header_greetingeveningnoname3 = /** @type {(inputs: Dashboard_Header_Greetingeveningnoname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مساء الخير.`)
};

/**
* | output |
* | --- |
* | "Good evening." |
*
* @param {Dashboard_Header_Greetingeveningnoname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_header_greetingeveningnoname3 = /** @type {((inputs?: Dashboard_Header_Greetingeveningnoname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Header_Greetingeveningnoname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_header_greetingeveningnoname3(inputs)
	if (locale === "es") return es_dashboard_header_greetingeveningnoname3(inputs)
	if (locale === "fr") return fr_dashboard_header_greetingeveningnoname3(inputs)
	return ar_dashboard_header_greetingeveningnoname3(inputs)
});
export { dashboard_header_greetingeveningnoname3 as "dashboard.header.greetingEveningNoName" }