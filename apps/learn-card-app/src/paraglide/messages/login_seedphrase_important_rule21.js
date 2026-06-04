/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Important_Rule21Inputs */

const en_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Never share it with anyone.`)
};

const es_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nunca la compartas con nadie.`)
};

const de_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teile ihn niemals mit jemandem.`)
};

const ar_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا تشاركها أبداً مع أي شخص.`)
};

const fr_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ne la partagez jamais avec quiconque.`)
};

const ko_login_seedphrase_important_rule21 = /** @type {(inputs: Login_Seedphrase_Important_Rule21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`절대 다른 사람과 공유하지 마세요.`)
};

/**
* | output |
* | --- |
* | "Never share it with anyone." |
*
* @param {Login_Seedphrase_Important_Rule21Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_rule21 = /** @type {((inputs?: Login_Seedphrase_Important_Rule21Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Rule21Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_rule21(inputs)
	if (locale === "es") return es_login_seedphrase_important_rule21(inputs)
	if (locale === "de") return de_login_seedphrase_important_rule21(inputs)
	if (locale === "ar") return ar_login_seedphrase_important_rule21(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_rule21(inputs)
	return ko_login_seedphrase_important_rule21(inputs)
});
export { login_seedphrase_important_rule21 as "login.seedPhrase.important.rule2" }