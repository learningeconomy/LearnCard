/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Header_Aisessions1Inputs */

const en_launchpad_header_aisessions1 = /** @type {(inputs: Launchpad_Header_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Sessions`)
};

const es_launchpad_header_aisessions1 = /** @type {(inputs: Launchpad_Header_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesiones de IA`)
};

const fr_launchpad_header_aisessions1 = /** @type {(inputs: Launchpad_Header_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sessions IA`)
};

const ar_launchpad_header_aisessions1 = /** @type {(inputs: Launchpad_Header_Aisessions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسات الذكاء الاصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Sessions" |
*
* @param {Launchpad_Header_Aisessions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_header_aisessions1 = /** @type {((inputs?: Launchpad_Header_Aisessions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Header_Aisessions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_header_aisessions1(inputs)
	if (locale === "es") return es_launchpad_header_aisessions1(inputs)
	if (locale === "fr") return fr_launchpad_header_aisessions1(inputs)
	return ar_launchpad_header_aisessions1(inputs)
});
export { launchpad_header_aisessions1 as "launchpad.header.aiSessions" }