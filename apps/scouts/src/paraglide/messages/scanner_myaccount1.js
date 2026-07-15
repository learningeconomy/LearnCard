/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Myaccount1Inputs */

const en_scanner_myaccount1 = /** @type {(inputs: Scanner_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Account`)
};

const es_scanner_myaccount1 = /** @type {(inputs: Scanner_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mi Cuenta`)
};

const fr_scanner_myaccount1 = /** @type {(inputs: Scanner_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mon compte`)
};

const ar_scanner_myaccount1 = /** @type {(inputs: Scanner_Myaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابي`)
};

/**
* | output |
* | --- |
* | "My Account" |
*
* @param {Scanner_Myaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_myaccount1 = /** @type {((inputs?: Scanner_Myaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Myaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_myaccount1(inputs)
	if (locale === "es") return es_scanner_myaccount1(inputs)
	if (locale === "fr") return fr_scanner_myaccount1(inputs)
	return ar_scanner_myaccount1(inputs)
});
export { scanner_myaccount1 as "scanner.myAccount" }