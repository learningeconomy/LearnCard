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

const de_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Etwas ist schiefgelaufen. Bitte versuche es erneut.`)
};

const ar_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما. يرجى المحاولة مرة أخرى.`)
};

const fr_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue. Veuillez réessayer.`)
};

const ko_login_seedphrase_error_generic1 = /** @type {(inputs: Login_Seedphrase_Error_Generic1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`문제가 발생했습니다. 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Something went wrong. Please try again." |
*
* @param {Login_Seedphrase_Error_Generic1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_error_generic1 = /** @type {((inputs?: Login_Seedphrase_Error_Generic1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Error_Generic1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_error_generic1(inputs)
	if (locale === "es") return es_login_seedphrase_error_generic1(inputs)
	if (locale === "de") return de_login_seedphrase_error_generic1(inputs)
	if (locale === "ar") return ar_login_seedphrase_error_generic1(inputs)
	if (locale === "fr") return fr_login_seedphrase_error_generic1(inputs)
	return ko_login_seedphrase_error_generic1(inputs)
});
export { login_seedphrase_error_generic1 as "login.seedPhrase.error.generic" }