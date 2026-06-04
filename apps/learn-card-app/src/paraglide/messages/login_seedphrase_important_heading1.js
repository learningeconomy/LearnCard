/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Seedphrase_Important_Heading1Inputs */

const en_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important!`)
};

const es_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Importante!`)
};

const de_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wichtig!`)
};

const ar_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهم!`)
};

const fr_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important !`)
};

const ko_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`중요!`)
};

/**
* | output |
* | --- |
* | "Important!" |
*
* @param {Login_Seedphrase_Important_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_heading1 = /** @type {((inputs?: Login_Seedphrase_Important_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_heading1(inputs)
	if (locale === "es") return es_login_seedphrase_important_heading1(inputs)
	if (locale === "de") return de_login_seedphrase_important_heading1(inputs)
	if (locale === "ar") return ar_login_seedphrase_important_heading1(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_heading1(inputs)
	return ko_login_seedphrase_important_heading1(inputs)
});
export { login_seedphrase_important_heading1 as "login.seedPhrase.important.heading" }