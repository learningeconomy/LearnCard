/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Welcome_Pills_CredentialsInputs */

const en_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credentials`)
};

const es_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credenciales`)
};

const de_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nachweise`)
};

const ar_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد`)
};

const fr_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certifications`)
};

const ko_login_welcome_pills_credentials = /** @type {(inputs: Login_Welcome_Pills_CredentialsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격 증명`)
};

/**
* | output |
* | --- |
* | "Credentials" |
*
* @param {Login_Welcome_Pills_CredentialsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_welcome_pills_credentials = /** @type {((inputs?: Login_Welcome_Pills_CredentialsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Welcome_Pills_CredentialsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_welcome_pills_credentials(inputs)
	if (locale === "es") return es_login_welcome_pills_credentials(inputs)
	if (locale === "de") return de_login_welcome_pills_credentials(inputs)
	if (locale === "ar") return ar_login_welcome_pills_credentials(inputs)
	if (locale === "fr") return fr_login_welcome_pills_credentials(inputs)
	return ko_login_welcome_pills_credentials(inputs)
});
export { login_welcome_pills_credentials as "login.welcome.pills.credentials" }