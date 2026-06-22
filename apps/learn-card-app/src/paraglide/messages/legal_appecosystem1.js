/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Appecosystem1Inputs */

const en_legal_appecosystem1 = /** @type {(inputs: Legal_Appecosystem1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Ecosystem`)
};

const es_legal_appecosystem1 = /** @type {(inputs: Legal_Appecosystem1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ecosistema de aplicaciones`)
};

const fr_legal_appecosystem1 = /** @type {(inputs: Legal_Appecosystem1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Écosystème d'applications`)
};

const ar_legal_appecosystem1 = /** @type {(inputs: Legal_Appecosystem1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نظام التطبيقات البيئي`)
};

/**
* | output |
* | --- |
* | "App Ecosystem" |
*
* @param {Legal_Appecosystem1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_appecosystem1 = /** @type {((inputs?: Legal_Appecosystem1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Appecosystem1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_appecosystem1(inputs)
	if (locale === "es") return es_legal_appecosystem1(inputs)
	if (locale === "fr") return fr_legal_appecosystem1(inputs)
	return ar_legal_appecosystem1(inputs)
});
export { legal_appecosystem1 as "legal.appEcosystem" }