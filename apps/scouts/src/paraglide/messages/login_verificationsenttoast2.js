/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Verificationsenttoast2Inputs */

const en_login_verificationsenttoast2 = /** @type {(inputs: Login_Verificationsenttoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A verification code has been sent`)
};

const es_login_verificationsenttoast2 = /** @type {(inputs: Login_Verificationsenttoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se ha enviado un código de verificación`)
};

const fr_login_verificationsenttoast2 = /** @type {(inputs: Login_Verificationsenttoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un code de vérification a été envoyé`)
};

const ar_login_verificationsenttoast2 = /** @type {(inputs: Login_Verificationsenttoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A verification code has been sent`)
};

/**
* | output |
* | --- |
* | "A verification code has been sent" |
*
* @param {Login_Verificationsenttoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_verificationsenttoast2 = /** @type {((inputs?: Login_Verificationsenttoast2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Verificationsenttoast2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_verificationsenttoast2(inputs)
	if (locale === "es") return es_login_verificationsenttoast2(inputs)
	if (locale === "fr") return fr_login_verificationsenttoast2(inputs)
	return ar_login_verificationsenttoast2(inputs)
});
export { login_verificationsenttoast2 as "login.verificationSentToast" }