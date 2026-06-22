/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Error_Generic1Inputs */

const en_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong. Please try again.`)
};

const es_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal. Intenta de nuevo.`)
};

const fr_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue. Veuillez réessayer.`)
};

const ar_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Something went wrong. Please try again." |
*
* @param {Login_Seedphrase_Error_Generic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_error_generic1 = /** @type {((inputs?: Login_Seedphrase_Error_Generic1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Error_Generic1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_error_generic1(inputs)
	if (locale === "es") return es_login_seedphrase_error_generic1(inputs)
	if (locale === "fr") return fr_login_seedphrase_error_generic1(inputs)
	return ar_login_seedphrase_error_generic1(inputs)
});
export { login_seedphrase_error_generic1 as "login.seedPhrase.error.generic" }