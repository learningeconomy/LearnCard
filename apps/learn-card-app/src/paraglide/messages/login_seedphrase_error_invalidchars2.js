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

const de_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Der Seed darf nur Zahlen und Buchstaben (a–f) enthalten.`)
};

const ar_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن تحتوي العبارة فقط على أرقام وحروف (a–f).`)
};

const fr_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La phrase ne doit contenir que des chiffres et des lettres (a–f).`)
};

const ko_login_seedphrase_error_invalidchars2 = /** @type {(inputs: Login_Seedphrase_Error_Invalidchars2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드는 숫자와 문자(a–f)만 포함해야 합니다.`)
};

/**
* | output |
* | --- |
* | "Seed must only contain numbers and letters (a–f)." |
*
* @param {Login_Seedphrase_Error_Invalidchars2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_error_invalidchars2 = /** @type {((inputs?: Login_Seedphrase_Error_Invalidchars2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Error_Invalidchars2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "es") return es_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "de") return de_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "ar") return ar_login_seedphrase_error_invalidchars2(inputs)
	if (locale === "fr") return fr_login_seedphrase_error_invalidchars2(inputs)
	return ko_login_seedphrase_error_invalidchars2(inputs)
});
export { login_seedphrase_error_invalidchars2 as "login.seedPhrase.error.invalidChars" }