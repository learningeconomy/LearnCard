/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Connecting1Inputs */

const en_appinstall_connecting1 = /** @type {(inputs: Appinstall_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecting...`)
};

const es_appinstall_connecting1 = /** @type {(inputs: Appinstall_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectando...`)
};

const fr_appinstall_connecting1 = /** @type {(inputs: Appinstall_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion...`)
};

const ar_appinstall_connecting1 = /** @type {(inputs: Appinstall_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الاتصال...`)
};

/**
* | output |
* | --- |
* | "Connecting..." |
*
* @param {Appinstall_Connecting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_connecting1 = /** @type {((inputs?: Appinstall_Connecting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Connecting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_connecting1(inputs)
	if (locale === "es") return es_appinstall_connecting1(inputs)
	if (locale === "fr") return fr_appinstall_connecting1(inputs)
	return ar_appinstall_connecting1(inputs)
});
export { appinstall_connecting1 as "appInstall.connecting" }