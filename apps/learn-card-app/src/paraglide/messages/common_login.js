/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_LoginInputs */

const en_common_login = /** @type {(inputs: Common_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Login`)
};

const es_common_login = /** @type {(inputs: Common_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión`)
};

const fr_common_login = /** @type {(inputs: Common_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion`)
};

const ar_common_login = /** @type {(inputs: Common_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول`)
};

/**
* | output |
* | --- |
* | "Login" |
*
* @param {Common_LoginInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_login = /** @type {((inputs?: Common_LoginInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_LoginInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_login(inputs)
	if (locale === "es") return es_common_login(inputs)
	if (locale === "fr") return fr_common_login(inputs)
	return ar_common_login(inputs)
});
export { common_login as "common.login" }