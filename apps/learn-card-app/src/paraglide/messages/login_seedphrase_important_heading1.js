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

const fr_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important !`)
};

const ar_login_seedphrase_important_heading1 = /** @type {(inputs: Login_Seedphrase_Important_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهم!`)
};

/**
* | output |
* | --- |
* | "Important!" |
*
* @param {Login_Seedphrase_Important_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_seedphrase_important_heading1 = /** @type {((inputs?: Login_Seedphrase_Important_Heading1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Seedphrase_Important_Heading1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_seedphrase_important_heading1(inputs)
	if (locale === "es") return es_login_seedphrase_important_heading1(inputs)
	if (locale === "fr") return fr_login_seedphrase_important_heading1(inputs)
	return ar_login_seedphrase_important_heading1(inputs)
});
export { login_seedphrase_important_heading1 as "login.seedPhrase.important.heading" }