/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Important_Rule31Inputs */

const en_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`If someone else has your seed, they can control your passport.`)
};

const es_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si alguien más tiene tu semilla, puede controlar tu pasaporte.`)
};

const de_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wenn jemand anderes deinen Seed hat, kann er deinen Ausweis kontrollieren.`)
};

const ar_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا حصل شخص آخر على عبارة الاسترداد، فيمكنه التحكم في جواز سفرك.`)
};

const fr_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si quelqu'un d'autre a votre phrase, il peut contrôler votre passeport.`)
};

const ko_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다른 사람이 시드를 가지고 있으면 패스포트를 제어할 수 있습니다.`)
};

/**
* | output |
* | --- |
* | "If someone else has your seed, they can control your passport." |
*
* @param {Login_Seedphrase_Important_Rule31Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_rule31 = /** @type {((inputs?: Login_Seedphrase_Important_Rule31Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Rule31Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_rule31(inputs)
	if (locale === "es") return es_login_seedphrase_important_rule31(inputs)
	if (locale === "de") return de_login_seedphrase_important_rule31(inputs)
	if (locale === "ar") return ar_login_seedphrase_important_rule31(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_rule31(inputs)
	return ko_login_seedphrase_important_rule31(inputs)
});
export { login_seedphrase_important_rule31 as "login.seedPhrase.important.rule3" }