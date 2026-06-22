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

const fr_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conservez votre phrase en lieu sûr et hors ligne.`)
};

const ar_login_seedphrase_important_rule11 = /** @type {(inputs: Login_Seedphrase_Important_Rule11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احتفظ بعبارة الاسترداد بأمان ودون اتصال.`)
};

/**
* | output |
* | --- |
* | "Keep your seed safe and offline." |
*
* @param {Login_Seedphrase_Important_Rule11Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_rule11 = /** @type {((inputs?: Login_Seedphrase_Important_Rule11Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Rule11Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_rule11(inputs)
	if (locale === "es") return es_login_seedphrase_important_rule11(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_rule11(inputs)
	return ar_login_seedphrase_important_rule11(inputs)
});
export { login_seedphrase_important_rule11 as "login.seedPhrase.important.rule1" }