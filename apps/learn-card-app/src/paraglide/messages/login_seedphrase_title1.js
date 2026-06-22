/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Title1Inputs */

const en_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a Seed Phrase to Import Your Passport`)
};

const es_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa una frase semilla para importar tu pasaporte`)
};

const fr_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser une phrase de récupération pour importer votre passeport`)
};

const ar_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم عبارة استرداد لاستيراد جواز سفرك`)
};

/**
* | output |
* | --- |
* | "Use a Seed Phrase to Import Your Passport" |
*
* @param {Login_Seedphrase_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_title1 = /** @type {((inputs?: Login_Seedphrase_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_title1(inputs)
	if (locale === "es") return es_login_seedphrase_title1(inputs)
	if (locale === "fr") return fr_login_seedphrase_title1(inputs)
	return ar_login_seedphrase_title1(inputs)
});
export { login_seedphrase_title1 as "login.seedPhrase.title" }