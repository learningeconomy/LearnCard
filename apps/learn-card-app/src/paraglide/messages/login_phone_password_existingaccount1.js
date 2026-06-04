/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Phone_Password_Existingaccount1Inputs */

const en_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Already have an account?`)
};

const es_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Ya tienes una cuenta?`)
};

const de_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hast du bereits ein Konto?`)
};

const ar_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل لديك حساب بالفعل؟`)
};

const fr_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez déjà un compte ?`)
};

const ko_login_phone_password_existingaccount1 = /** @type {(inputs: Login_Phone_Password_Existingaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 계정이 있으신가요?`)
};

/**
* | output |
* | --- |
* | "Already have an account?" |
*
* @param {Login_Phone_Password_Existingaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_password_existingaccount1 = /** @type {((inputs?: Login_Phone_Password_Existingaccount1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Password_Existingaccount1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_password_existingaccount1(inputs)
	if (locale === "es") return es_login_phone_password_existingaccount1(inputs)
	if (locale === "de") return de_login_phone_password_existingaccount1(inputs)
	if (locale === "ar") return ar_login_phone_password_existingaccount1(inputs)
	if (locale === "fr") return fr_login_phone_password_existingaccount1(inputs)
	return ko_login_phone_password_existingaccount1(inputs)
});
export { login_phone_password_existingaccount1 as "login.phone.password.existingAccount" }