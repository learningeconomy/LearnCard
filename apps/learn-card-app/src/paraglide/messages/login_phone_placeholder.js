/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_PlaceholderInputs */

const en_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number`)
};

const es_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de teléfono`)
};

const de_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Telefonnummer`)
};

const ar_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم الهاتف`)
};

const fr_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de téléphone`)
};

const ko_login_phone_placeholder = /** @type {(inputs: Login_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전화번호`)
};

/**
* | output |
* | --- |
* | "Phone Number" |
*
* @param {Login_Phone_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_placeholder = /** @type {((inputs?: Login_Phone_PlaceholderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_PlaceholderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_placeholder(inputs)
	if (locale === "es") return es_login_phone_placeholder(inputs)
	if (locale === "de") return de_login_phone_placeholder(inputs)
	if (locale === "ar") return ar_login_phone_placeholder(inputs)
	if (locale === "fr") return fr_login_phone_placeholder(inputs)
	return ko_login_phone_placeholder(inputs)
});
export { login_phone_placeholder as "login.phone.placeholder" }