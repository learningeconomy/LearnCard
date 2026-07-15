/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phoneplaceholder1Inputs */

const en_login_phoneplaceholder1 = /** @type {(inputs: Login_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number`)
};

const es_login_phoneplaceholder1 = /** @type {(inputs: Login_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de Teléfono`)
};

const fr_login_phoneplaceholder1 = /** @type {(inputs: Login_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de téléphone`)
};

const ar_login_phoneplaceholder1 = /** @type {(inputs: Login_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number`)
};

/**
* | output |
* | --- |
* | "Phone Number" |
*
* @param {Login_Phoneplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_phoneplaceholder1 = /** @type {((inputs?: Login_Phoneplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phoneplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phoneplaceholder1(inputs)
	if (locale === "es") return es_login_phoneplaceholder1(inputs)
	if (locale === "fr") return fr_login_phoneplaceholder1(inputs)
	return ar_login_phoneplaceholder1(inputs)
});
export { login_phoneplaceholder1 as "login.phonePlaceholder" }