/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Privacypolicy1Inputs */

const en_login_privacypolicy1 = /** @type {(inputs: Login_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_login_privacypolicy1 = /** @type {(inputs: Login_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de Privacidad`)
};

const fr_login_privacypolicy1 = /** @type {(inputs: Login_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const ar_login_privacypolicy1 = /** @type {(inputs: Login_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Login_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_privacypolicy1 = /** @type {((inputs?: Login_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Privacypolicy1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_privacypolicy1(inputs)
	if (locale === "es") return es_login_privacypolicy1(inputs)
	if (locale === "fr") return fr_login_privacypolicy1(inputs)
	return ar_login_privacypolicy1(inputs)
});
export { login_privacypolicy1 as "login.privacyPolicy" }