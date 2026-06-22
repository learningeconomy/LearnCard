/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Error_Invalidchars2Inputs */

const en_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed must only contain numbers and letters (a–f).`)
};

const es_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La semilla solo debe contener números y letras (a–f).`)
};

const fr_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La phrase ne doit contenir que des chiffres et des lettres (a–f).`)
};

const ar_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن تحتوي العبارة فقط على أرقام وحروف (a–f).`)
};

/**
* | output |
* | --- |
* | "Seed must only contain numbers and letters (a–f)." |
*
* @param {Login_Seedphrase_Error_Invalidchars2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_error_invalidchars2 = /** @type {((inputs?: Login_Seedphrase_Error_Invalidchars2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Error_Invalidchars2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "es") return es_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "fr") return fr_login_seedphrase_error_invalidchars2(inputs)
	return ar_login_seedphrase_error_invalidchars2(inputs)
});
export { login_seedphrase_error_invalidchars2 as "login.seedPhrase.error.invalidChars" }