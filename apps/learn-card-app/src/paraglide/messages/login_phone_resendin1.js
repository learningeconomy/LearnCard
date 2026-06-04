/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ seconds: NonNullable<unknown> }} Login_Phone_Resendin1Inputs */

const en_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Resend in ${i?.seconds}s`)
};

const es_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Reenviar en ${i?.seconds}s`)
};

const de_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erneut senden in ${i?.seconds}s`)
};

const ar_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إعادة الإرسال خلال ${i?.seconds} ثانية`)
};

const fr_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Renvoyer dans ${i?.seconds}s`)
};

const ko_login_phone_resendin1 = /** @type {(inputs: Login_Phone_Resendin1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.seconds}초 후 재전송`)
};

/**
* | output |
* | --- |
* | "Resend in {seconds}s" |
*
* @param {Login_Phone_Resendin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_phone_resendin1 = /** @type {((inputs: Login_Phone_Resendin1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Phone_Resendin1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_phone_resendin1(inputs)
	if (locale === "es") return es_login_phone_resendin1(inputs)
	if (locale === "de") return de_login_phone_resendin1(inputs)
	if (locale === "ar") return ar_login_phone_resendin1(inputs)
	if (locale === "fr") return fr_login_phone_resendin1(inputs)
	return ko_login_phone_resendin1(inputs)
});
export { login_phone_resendin1 as "login.phone.resendIn" }