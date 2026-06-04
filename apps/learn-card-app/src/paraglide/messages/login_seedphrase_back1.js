/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Back1Inputs */

const en_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const de_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

const fr_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ko_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`뒤로`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Login_Seedphrase_Back1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_back1 = /** @type {((inputs?: Login_Seedphrase_Back1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Back1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_back1(inputs)
	if (locale === "es") return es_login_seedphrase_back1(inputs)
	if (locale === "de") return de_login_seedphrase_back1(inputs)
	if (locale === "ar") return ar_login_seedphrase_back1(inputs)
	if (locale === "fr") return fr_login_seedphrase_back1(inputs)
	return ko_login_seedphrase_back1(inputs)
});
export { login_seedphrase_back1 as "login.seedPhrase.back" }