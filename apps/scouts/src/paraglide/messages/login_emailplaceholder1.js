/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Emailplaceholder1Inputs */

const en_login_emailplaceholder1 = /** @type {(inputs: Login_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

const es_login_emailplaceholder1 = /** @type {(inputs: Login_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dirección de correo`)
};

const fr_login_emailplaceholder1 = /** @type {(inputs: Login_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse e-mail`)
};

const ar_login_emailplaceholder1 = /** @type {(inputs: Login_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email address`)
};

/**
* | output |
* | --- |
* | "Email address" |
*
* @param {Login_Emailplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_emailplaceholder1 = /** @type {((inputs?: Login_Emailplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Emailplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_emailplaceholder1(inputs)
	if (locale === "es") return es_login_emailplaceholder1(inputs)
	if (locale === "fr") return fr_login_emailplaceholder1(inputs)
	return ar_login_emailplaceholder1(inputs)
});
export { login_emailplaceholder1 as "login.emailPlaceholder" }