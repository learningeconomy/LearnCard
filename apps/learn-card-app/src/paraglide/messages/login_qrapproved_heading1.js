/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Login_Qrapproved_Heading1Inputs */

const en_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're all set!`)
};

const es_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Todo listo!`)
};

const de_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alles bereit!`)
};

const ar_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت جاهز!`)
};

const fr_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes prêt !`)
};

const ko_login_qrapproved_heading1 = /** @type {(inputs: Login_Qrapproved_Heading1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모두 준비되었습니다!`)
};

/**
* | output |
* | --- |
* | "You're all set!" |
*
* @param {Login_Qrapproved_Heading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const login_qrapproved_heading1 = /** @type {((inputs?: Login_Qrapproved_Heading1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Login_Qrapproved_Heading1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_login_qrapproved_heading1(inputs)
	if (locale === "es") return es_login_qrapproved_heading1(inputs)
	if (locale === "de") return de_login_qrapproved_heading1(inputs)
	if (locale === "ar") return ar_login_qrapproved_heading1(inputs)
	if (locale === "fr") return fr_login_qrapproved_heading1(inputs)
	return ko_login_qrapproved_heading1(inputs)
});
export { login_qrapproved_heading1 as "login.qrApproved.heading" }