/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Login1Inputs */

const en_consentflow_login1 = /** @type {(inputs: Consentflow_Login1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login`)
};

const es_consentflow_login1 = /** @type {(inputs: Consentflow_Login1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Sesión`)
};

const fr_consentflow_login1 = /** @type {(inputs: Consentflow_Login1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion`)
};

const ar_consentflow_login1 = /** @type {(inputs: Consentflow_Login1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login`)
};

/**
* | output |
* | --- |
* | "Login" |
*
* @param {Consentflow_Login1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_login1 = /** @type {((inputs?: Consentflow_Login1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Login1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_login1(inputs)
	if (locale === "es") return es_consentflow_login1(inputs)
	if (locale === "fr") return fr_consentflow_login1(inputs)
	return ar_consentflow_login1(inputs)
});
export { consentflow_login1 as "consentFlow.login" }