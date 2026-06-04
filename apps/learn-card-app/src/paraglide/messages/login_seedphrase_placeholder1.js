/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Placeholder1Inputs */

const en_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste your seed phrase or key here...`)
};

const es_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega tu frase semilla o clave aquí...`)
};

const de_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Füge deine Seed-Phrase oder deinen Schlüssel hier ein...`)
};

const ar_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق عبارة الاسترداد أو المفتاح هنا...`)
};

const fr_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez votre phrase de récupération ou clé ici...`)
};

const ko_login_seedphrase_placeholder1 = /** @type {(inputs: Login_Seedphrase_Placeholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드 구문 또는 키를 여기에 붙여넣으세요...`)
};

/**
* | output |
* | --- |
* | "Paste your seed phrase or key here..." |
*
* @param {Login_Seedphrase_Placeholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_placeholder1 = /** @type {((inputs?: Login_Seedphrase_Placeholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Placeholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_placeholder1(inputs)
	if (locale === "es") return es_login_seedphrase_placeholder1(inputs)
	if (locale === "de") return de_login_seedphrase_placeholder1(inputs)
	if (locale === "ar") return ar_login_seedphrase_placeholder1(inputs)
	if (locale === "fr") return fr_login_seedphrase_placeholder1(inputs)
	return ko_login_seedphrase_placeholder1(inputs)
});
export { login_seedphrase_placeholder1 as "login.seedPhrase.placeholder" }