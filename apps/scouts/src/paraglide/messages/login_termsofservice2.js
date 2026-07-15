/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Termsofservice2Inputs */

const en_login_termsofservice2 = /** @type {(inputs: Login_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terms of Service`)
};

const es_login_termsofservice2 = /** @type {(inputs: Login_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Términos del Servicio`)
};

const fr_login_termsofservice2 = /** @type {(inputs: Login_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conditions d'utilisation`)
};

const ar_login_termsofservice2 = /** @type {(inputs: Login_Termsofservice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شروط الخدمة`)
};

/**
* | output |
* | --- |
* | "Terms of Service" |
*
* @param {Login_Termsofservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_termsofservice2 = /** @type {((inputs?: Login_Termsofservice2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Termsofservice2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_termsofservice2(inputs)
	if (locale === "es") return es_login_termsofservice2(inputs)
	if (locale === "fr") return fr_login_termsofservice2(inputs)
	return ar_login_termsofservice2(inputs)
});
export { login_termsofservice2 as "login.termsOfService" }