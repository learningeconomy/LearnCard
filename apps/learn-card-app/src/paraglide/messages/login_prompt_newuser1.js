/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Prompt_Newuser1Inputs */

const en_login_prompt_newuser1 = /** @type {(inputs: Login_Prompt_Newuser1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create your account in a few quick steps.`)
};

const es_login_prompt_newuser1 = /** @type {(inputs: Login_Prompt_Newuser1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu cuenta en unos pocos pasos rápidos.`)
};

const fr_login_prompt_newuser1 = /** @type {(inputs: Login_Prompt_Newuser1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre compte en quelques étapes rapides.`)
};

const ar_login_prompt_newuser1 = /** @type {(inputs: Login_Prompt_Newuser1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ حسابك في بضع خطوات سريعة.`)
};

/**
* | output |
* | --- |
* | "Create your account in a few quick steps." |
*
* @param {Login_Prompt_Newuser1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_prompt_newuser1 = /** @type {((inputs?: Login_Prompt_Newuser1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Prompt_Newuser1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_prompt_newuser1(inputs)
	if (locale === "es") return es_login_prompt_newuser1(inputs)
	if (locale === "fr") return fr_login_prompt_newuser1(inputs)
	return ar_login_prompt_newuser1(inputs)
});
export { login_prompt_newuser1 as "login.prompt.newUser" }