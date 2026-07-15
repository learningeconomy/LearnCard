/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Signinfromdevice3Inputs */

const en_login_signinfromdevice3 = /** @type {(inputs: Login_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in from another device`)
};

const es_login_signinfromdevice3 = /** @type {(inputs: Login_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión desde otro dispositivo`)
};

const fr_login_signinfromdevice3 = /** @type {(inputs: Login_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous depuis un autre appareil`)
};

const ar_login_signinfromdevice3 = /** @type {(inputs: Login_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign in from another device`)
};

/**
* | output |
* | --- |
* | "Sign in from another device" |
*
* @param {Login_Signinfromdevice3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_signinfromdevice3 = /** @type {((inputs?: Login_Signinfromdevice3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Signinfromdevice3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_signinfromdevice3(inputs)
	if (locale === "es") return es_login_signinfromdevice3(inputs)
	if (locale === "fr") return fr_login_signinfromdevice3(inputs)
	return ar_login_signinfromdevice3(inputs)
});
export { login_signinfromdevice3 as "login.signInFromDevice" }