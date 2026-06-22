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

const fr_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si quelqu'un d'autre a votre phrase, il peut contrôler votre passeport.`)
};

const ar_login_seedphrase_important_rule31 = /** @type {(inputs: Login_Seedphrase_Important_Rule31Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إذا حصل شخص آخر على عبارة الاسترداد، فيمكنه التحكم في جواز سفرك.`)
};

/**
* | output |
* | --- |
* | "If someone else has your seed, they can control your passport." |
*
* @param {Login_Seedphrase_Important_Rule31Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_rule31 = /** @type {((inputs?: Login_Seedphrase_Important_Rule31Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Rule31Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_rule31(inputs)
	if (locale === "es") return es_login_seedphrase_important_rule31(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_rule31(inputs)
	return ar_login_seedphrase_important_rule31(inputs)
});
export { login_seedphrase_important_rule31 as "login.seedPhrase.important.rule3" }