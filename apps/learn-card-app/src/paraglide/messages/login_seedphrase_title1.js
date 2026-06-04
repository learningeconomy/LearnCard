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

const de_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seed-Phrase zum Importieren deines Ausweises verwenden`)
};

const ar_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم عبارة استرداد لاستيراد جواز سفرك`)
};

const fr_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser une phrase de récupération pour importer votre passeport`)
};

const ko_login_seedphrase_title1 = /** @type {(inputs: Login_Seedphrase_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 구문을 사용하여 패스포트 가져오기`)
};

/**
* | output |
* | --- |
* | "Use a Seed Phrase to Import Your Passport" |
*
* @param {Login_Seedphrase_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_title1 = /** @type {((inputs?: Login_Seedphrase_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_title1(inputs)
	if (locale === "es") return es_login_seedphrase_title1(inputs)
	if (locale === "de") return de_login_seedphrase_title1(inputs)
	if (locale === "ar") return ar_login_seedphrase_title1(inputs)
	if (locale === "fr") return fr_login_seedphrase_title1(inputs)
	return ko_login_seedphrase_title1(inputs)
});
export { login_seedphrase_title1 as "login.seedPhrase.title" }