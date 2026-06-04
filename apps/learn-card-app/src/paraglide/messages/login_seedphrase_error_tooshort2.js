/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Error_Tooshort2Inputs */

const en_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed phrase needs to be 64 characters long.`)
};

const es_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La frase semilla debe tener 64 caracteres.`)
};

const de_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Die Seed-Phrase muss 64 Zeichen lang sein.`)
};

const ar_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن تتكون عبارة الاسترداد من 64 حرفاً.`)
};

const fr_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La phrase de récupération doit comporter 64 caractères.`)
};

const ko_login_seedphrase_error_tooshort2 = /** @type {(inputs: Login_Seedphrase_Error_Tooshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 구문은 64자여야 합니다.`)
};

/**
* | output |
* | --- |
* | "Seed phrase needs to be 64 characters long." |
*
* @param {Login_Seedphrase_Error_Tooshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_error_tooshort2 = /** @type {((inputs?: Login_Seedphrase_Error_Tooshort2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Error_Tooshort2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_error_tooshort2(inputs)
	if (locale === "es") return es_login_seedphrase_error_tooshort2(inputs)
	if (locale === "de") return de_login_seedphrase_error_tooshort2(inputs)
	if (locale === "ar") return ar_login_seedphrase_error_tooshort2(inputs)
	if (locale === "fr") return fr_login_seedphrase_error_tooshort2(inputs)
	return ko_login_seedphrase_error_tooshort2(inputs)
});
export { login_seedphrase_error_tooshort2 as "login.seedPhrase.error.tooShort" }