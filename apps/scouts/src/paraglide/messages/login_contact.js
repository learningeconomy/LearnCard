/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_ContactInputs */

const en_login_contact = /** @type {(inputs: Login_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const es_login_contact = /** @type {(inputs: Login_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contacto`)
};

const fr_login_contact = /** @type {(inputs: Login_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

const ar_login_contact = /** @type {(inputs: Login_ContactInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact`)
};

/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Login_ContactInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_contact = /** @type {((inputs?: Login_ContactInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_ContactInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_contact(inputs)
	if (locale === "es") return es_login_contact(inputs)
	if (locale === "fr") return fr_login_contact(inputs)
	return ar_login_contact(inputs)
});
export { login_contact as "login.contact" }