/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Prompt_DefaultInputs */

const en_login_prompt_default = /** @type {(inputs: Login_Prompt_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in or create your account.`)
};

const es_login_prompt_default = /** @type {(inputs: Login_Prompt_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión o crea tu cuenta.`)
};

const fr_login_prompt_default = /** @type {(inputs: Login_Prompt_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous ou créez votre compte.`)
};

const ar_login_prompt_default = /** @type {(inputs: Login_Prompt_DefaultInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجّل الدخول أو أنشئ حسابك.`)
};

/**
* | output |
* | --- |
* | "Sign in or create your account." |
*
* @param {Login_Prompt_DefaultInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_prompt_default = /** @type {((inputs?: Login_Prompt_DefaultInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Prompt_DefaultInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_prompt_default(inputs)
	if (locale === "es") return es_login_prompt_default(inputs)
	if (locale === "fr") return fr_login_prompt_default(inputs)
	return ar_login_prompt_default(inputs)
});
export { login_prompt_default as "login.prompt.default" }