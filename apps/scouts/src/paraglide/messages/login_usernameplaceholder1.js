/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Usernameplaceholder1Inputs */

const en_login_usernameplaceholder1 = /** @type {(inputs: Login_Usernameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Username`)
};

const es_login_usernameplaceholder1 = /** @type {(inputs: Login_Usernameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nombre de usuario`)
};

const fr_login_usernameplaceholder1 = /** @type {(inputs: Login_Usernameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom d'utilisateur`)
};

const ar_login_usernameplaceholder1 = /** @type {(inputs: Login_Usernameplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اسم المستخدم`)
};

/**
* | output |
* | --- |
* | "Username" |
*
* @param {Login_Usernameplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_usernameplaceholder1 = /** @type {((inputs?: Login_Usernameplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Usernameplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_usernameplaceholder1(inputs)
	if (locale === "es") return es_login_usernameplaceholder1(inputs)
	if (locale === "fr") return fr_login_usernameplaceholder1(inputs)
	return ar_login_usernameplaceholder1(inputs)
});
export { login_usernameplaceholder1 as "login.usernamePlaceholder" }