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

const fr_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

const ar_login_seedphrase_back1 = /** @type {(inputs: Login_Seedphrase_Back1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رجوع`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Login_Seedphrase_Back1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_back1 = /** @type {((inputs?: Login_Seedphrase_Back1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Back1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_back1(inputs)
	if (locale === "es") return es_login_seedphrase_back1(inputs)
	if (locale === "fr") return fr_login_seedphrase_back1(inputs)
	return ar_login_seedphrase_back1(inputs)
});
export { login_seedphrase_back1 as "login.seedPhrase.back" }