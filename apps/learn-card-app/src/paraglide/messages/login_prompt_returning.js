/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Prompt_ReturningInputs */

const en_login_prompt_returning = /** @type {(inputs: Login_Prompt_ReturningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welcome back — sign in to continue.`)
};

const es_login_prompt_returning = /** @type {(inputs: Login_Prompt_ReturningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenido de nuevo: inicia sesión para continuar.`)
};

const fr_login_prompt_returning = /** @type {(inputs: Login_Prompt_ReturningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bon retour — connectez-vous pour continuer.`)
};

const ar_login_prompt_returning = /** @type {(inputs: Login_Prompt_ReturningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرحبًا بعودتك — سجّل الدخول للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Welcome back — sign in to continue." |
*
* @param {Login_Prompt_ReturningInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_prompt_returning = /** @type {((inputs?: Login_Prompt_ReturningInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Prompt_ReturningInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_prompt_returning(inputs)
	if (locale === "es") return es_login_prompt_returning(inputs)
	if (locale === "fr") return fr_login_prompt_returning(inputs)
	return ar_login_prompt_returning(inputs)
});
export { login_prompt_returning as "login.prompt.returning" }