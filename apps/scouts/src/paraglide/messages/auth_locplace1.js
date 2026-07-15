/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Locplace1Inputs */

const en_auth_locplace1 = /** @type {(inputs: Auth_Locplace1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter your location...`)
};

const es_auth_locplace1 = /** @type {(inputs: Auth_Locplace1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresa tu ubicación...`)
};

const fr_auth_locplace1 = /** @type {(inputs: Auth_Locplace1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entrez votre localisation...`)
};

const ar_auth_locplace1 = /** @type {(inputs: Auth_Locplace1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أدخل موقعك...`)
};

/**
* | output |
* | --- |
* | "Enter your location..." |
*
* @param {Auth_Locplace1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_locplace1 = /** @type {((inputs?: Auth_Locplace1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Locplace1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_locplace1(inputs)
	if (locale === "es") return es_auth_locplace1(inputs)
	if (locale === "fr") return fr_auth_locplace1(inputs)
	return ar_auth_locplace1(inputs)
});
export { auth_locplace1 as "auth.locPlace" }