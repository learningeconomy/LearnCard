/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Important_Rule11Inputs */

const en_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keep your seed safe and offline.`)
};

const es_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda tu semilla de forma segura y sin conexión.`)
};

const de_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bewahre deinen Seed sicher und offline auf.`)
};

const ar_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احتفظ بعبارة الاسترداد بأمان ودون اتصال.`)
};

const fr_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conservez votre phrase en lieu sûr et hors ligne.`)
};

const ko_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`시드를 안전하게 오프라인으로 보관하세요.`)
};

/**
* | output |
* | --- |
* | "Keep your seed safe and offline." |
*
* @param {Login_Seedphrase_Important_Rule11Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_rule11 = /** @type {((inputs?: Login_Seedphrase_Important_Rule11Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Rule11Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_rule11(inputs)
	if (locale === "es") return es_login_seedphrase_important_rule11(inputs)
	if (locale === "de") return de_login_seedphrase_important_rule11(inputs)
	if (locale === "ar") return ar_login_seedphrase_important_rule11(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_rule11(inputs)
	return ko_login_seedphrase_important_rule11(inputs)
});
export { login_seedphrase_important_rule11 as "login.seedPhrase.important.rule1" }