/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Qrapproved_Continuebutton2Inputs */

const en_login_qrapproved_continuebutton2 = /** @type {(inputs: Login_Qrapproved_Continuebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Sign In`)
};

const es_login_qrapproved_continuebutton2 = /** @type {(inputs: Login_Qrapproved_Continuebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar para iniciar sesión`)
};

const fr_login_qrapproved_continuebutton2 = /** @type {(inputs: Login_Qrapproved_Continuebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers la connexion`)
};

const ar_login_qrapproved_continuebutton2 = /** @type {(inputs: Login_Qrapproved_Continuebutton2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة إلى تسجيل الدخول`)
};

/**
* | output |
* | --- |
* | "Continue to Sign In" |
*
* @param {Login_Qrapproved_Continuebutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_continuebutton2 = /** @type {((inputs?: Login_Qrapproved_Continuebutton2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Qrapproved_Continuebutton2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_qrapproved_continuebutton2(inputs)
	if (locale === "es") return es_login_qrapproved_continuebutton2(inputs)
	if (locale === "fr") return fr_login_qrapproved_continuebutton2(inputs)
	return ar_login_qrapproved_continuebutton2(inputs)
});
export { login_qrapproved_continuebutton2 as "login.qrApproved.continueButton" }